'use strict';

const Faker = require('faker');

const Server = require('../../server');
const Fixtures = require('../fixtures');

const db = Fixtures.db;

const lab = exports.lab = require('lab').script();
const expect = require('code').expect;

const before = lab.before;
const after = lab.after;
const describe = lab.describe;
const it = lab.it;

describe('GET /activities/{id}', () => {

  let server;
  const user1 = Fixtures.user();
  const user2 = Fixtures.user();
  const activity1 = Fixtures.activity({ user_id: user1.id }, true);
  const activity2 = Fixtures.activity({ user_id: user2.id }, true);

  before(() => {

    return Promise.all([
      Server,
      db.users.insert(user1),
      db.users.insert(user2)
    ]).then((items) => {

      server = items[0];
      return Promise.all([
        db.activities.insert(activity1),
        db.activities.insert(activity2)
      ]);
    });
  });

  after(() => {

    return Promise.all([
      db.users.destroy({ id: user1.id }),
      db.users.destroy({ id: user2.id })
    ]);
  });

  it('finds activity', () => {

    return server.inject({ method: 'get', url: `/activities/${activity1.id}`, credentials: user1 }).then((res) => {

      expect(res.statusCode).to.equal(200);
      return res.result;
    }).then((result) => {

      expect(result).to.include({ id: activity1.id, name: activity1.name });
    });
  });

  it('does not find other user\'s activity', () => {

    return server.inject({ method: 'get', url: `/activities/${activity2.id}`, credentials: user1 }).then((res) => {

      expect(res.statusCode).to.equal(404);
    });
  });

  it('does not find nonexistant activity', () => {

    return server.inject({ method: 'get', url: `/activities/${Faker.random.uuid()}`, credentials: user1 }).then((res) => {

      expect(res.statusCode).to.equal(404);
    });
  });
});
