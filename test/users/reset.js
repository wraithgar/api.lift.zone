'use strict';

const Server = require('../../server');
const Fixtures = require('../fixtures');
const Faker = require('faker');

const db = Fixtures.db;

const lab = exports.lab = require('lab').script();
const expect = require('code').expect;

const before = lab.before;
const after = lab.after;
const describe = lab.describe;
const it = lab.it;

describe('POST /user/reset', () => {

  let server;
  const user = Fixtures.user({ logout: Faker.date.past() });
  const recovery = Fixtures.recovery({ email: user.email });
  before(() => {

    return Promise.all([
      Server,
      db.users.insert(user)
    ]).then((items) => {

      server = items[0];
      return db.recoveries.insert(recovery);
    });
  });

  after(() => {

    return db.users.destroy({ id: user.id });
  });

  it('resets password', () => {

    const newPassword = Faker.internet.password();
    return server.inject({ method: 'post', url: '/user/reset', credentials: user, payload: { token: recovery.token, password: newPassword, passwordConfirm: newPassword } }).then((res) => {

      expect(res.statusCode).to.equal(201);
      return res.result;
    }).then((result) => {

      expect(result).to.include(['token']);
      return db.users.findOne({ id: user.id }).then((resetUser) => {

        expect(resetUser.hash).to.not.equal(user.hash);
        expect(resetUser.logout).to.be.above(user.logout);
        return server.inject({ method: 'get', url: '/user', headers: { authorization: result.token } }).then((userRes) => {

          expect(userRes.statusCode).to.equal(200);
          return userRes.result;
        }).then((userResult) => {

          expect(userResult.id).to.equal(user.id);
          return db.recoveries.findOne({ token: recovery.token }).then((deletedRecovery) => {

            expect(deletedRecovery).to.not.exist();
          });
        });
      });
    });
  });

  it('rejects invalid token', () => {

    const newPassword = Faker.internet.password();
    return server.inject({ method: 'post', url: '/user/reset', credentials: user, payload: { token: Faker.random.uuid(), password: newPassword, passwordConfirm: newPassword } }).then((res) => {

      expect(res.statusCode).to.equal(404);
    });
  });
});
