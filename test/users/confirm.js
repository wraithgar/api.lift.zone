'use strict';

const Fixtures = require('../fixtures');
const Faker = require('faker');

const db = Fixtures.db;
const Server = Fixtures.server;

const lab = exports.lab = require('lab').script();
const expect = require('code').expect;

const before = lab.before;
const after = lab.after;
const describe = lab.describe;
const it = lab.it;

describe('POST /user/confirm', () => {

  let server;
  const user1 = Fixtures.user({ validated: false });
  const user2 = Fixtures.user({ validated: false });
  const validation1 = Fixtures.validation({ user_id: user1.id });
  const validation2 = Fixtures.validation({ user_id: user2.id, created_at: Faker.date.past(1, new Date(Date.now() + 86401000)) });
  before(() => {

    return Promise.all([
      Server,
      db.users.insert(user1),
      db.users.insert(user2)
    ]).then((items) => {

      server = items[0];
      return Promise.all([
        db.validations.insert(validation1),
        db.validations.insert(validation2)
      ]);
    });
  });

  after(() => {

    return Promise.all([
      db.users.destroy({ id: user1.id }),
      db.users.destroy({ id: user2.id })
    ]);
  });

  it('confirms user', () => {

    return server.inject({ method: 'post', url: '/user/confirm', auth: { strategy: 'jwt', credentials: user1 }, payload: { token: validation1.token } }).then((res) => {

      expect(res.statusCode).to.equal(200);
      return res.result;
    }).then((result) => {

      expect(result.validated).to.equal(true);
      expect(result).to.not.include('hash');
      return db.users.findOne({ id: user1.id });
    }).then((updatedUser) => {

      expect(updatedUser.validated).to.equal(true);
      return db.validations.findOne({ user_id: user1.id });
    }).then((existingValidation) => {

      expect(existingValidation).to.not.exist();
    });
  });

  it('ignores invalid token', () => {

    return server.inject({ method: 'post', url: '/user/confirm', auth: { strategy: 'jwt', credentials: user2 }, payload: { token: Faker.random.uuid() } }).then((res) => {

      expect(res.statusCode).to.equal(404);
      return db.users.findOne({ id: user2.id });
    }).then((updatedUser) => {

      expect(updatedUser.validated).to.equal(false);
    });
  });

  it('ignores old token', () => {

    return server.inject({ method: 'post', url: '/user/confirm', auth: { strategy: 'jwt', credentials: user2 }, payload: { token: validation2.token } }).then((res) => {

      expect(res.statusCode).to.equal(404);
      return db.users.findOne({ id: user2.id });
    }).then((updatedUser) => {

      expect(updatedUser.validated).to.equal(false);
    });
  });
});
