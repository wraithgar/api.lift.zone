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

describe('POST /activities/{id}', () => {

  let server;
  const user1 = Fixtures.user();
  const user2 = Fixtures.user();
  const activity1 = Fixtures.activity();
  const activity2 = Fixtures.activity({ activity_id: Faker.random.uuid() });
  const activity3 = Fixtures.activity({ user_id: user1.id }, true);
  const activity4 = Fixtures.activity({ activity_id: activity3.id });

  before(() => {

    return Promise.all([
      Server,
      db.users.insert(user1),
      db.users.insert(user2)
    ]).then((items) => {

      server = items[0];
      return Promise.all([
        db.activities.insert(activity3)
      ]);
    });
  });

  after(() => {

    return Promise.all([
      db.users.destroy({ id: user1.id }),
      db.users.destroy({ id: user2.id })
    ]);
  });

  it('creates an activity', () => {

    return server.inject({ method: 'post', url: '/activities', credentials: user1, payload: activity1 }).then((res) => {

      expect(res.statusCode).to.equal(201);
      return res.result;
    }).then((result) => {

      expect(result).to.include(activity1);
    });
  });

  it('404 on invalid activity_id', () => {

    return server.inject({ method: 'post', url: '/activities', credentials: user1, payload: activity2 }).then((res) => {

      expect(res.statusCode).to.equal(404);
    });
  });

  it('does not find other user\'s activity', () => {

    return server.inject({ method: 'post', url: '/activities', credentials: user2, payload: activity4 }).then((res) => {

      expect(res.statusCode).to.equal(404);
    });
  });

  it('creates alias', () => {

    return server.inject({ method: 'post', url: '/activities', credentials: user1, payload: activity4 }).then((res) => {

      expect(res.statusCode).to.equal(201);
      return res.result;
    }).then((result) => {

      expect(result).to.include(activity4);
    });
  });
});
