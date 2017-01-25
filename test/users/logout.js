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

describe('POST /user/logout', () => {

  let server;
  const user = Fixtures.user({ logout: Faker.date.past() });
  before(() => {

    return Promise.all([
      Server,
      db.users.insert(user)
    ]).then((items) => {

      server = items[0];
    });
  });

  after(() => {

    return db.users.destroy({ id: user.id });
  });

  it('can logout', () => {

    return server.inject({ method: 'post', url: '/user/logout', credentials: user }).then((res) => {

      expect(res.statusCode).to.equal(204);
      return db.users.findOne({ id: user.id });
    }).then((updatedUser) => {

      expect(updatedUser.logout).to.be.above(user.logout);
    });
  });
});
