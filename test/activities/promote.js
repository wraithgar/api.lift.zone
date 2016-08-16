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

describe('PUT /activities/{id}/promote', () => {

  let server;
  const user = Fixtures.user();
  const activity1 = Fixtures.activity({ user_id: user.id }, true);
  const activity2 = Fixtures.activity({ activity_id: activity1.id, user_id: user.id }, true);
  const activity3 = Fixtures.activity({ user_id: user.id });

  before(() => {

    return Promise.all([
      Server,
      db.users.insert(user)
    ]).then((items) => {

      server = items[0];
      return Promise.all([
        db.activities.insert(activity1),
        db.activities.insert(activity3)
      ]);
    }).then(() => {

      return db.activities.insert(activity2);
    });
  });

  after(() => {

    return Promise.all([
      db.users.destroy({ id: user.id })
    ]);
  });

  it('promotes an activity', () => {

    return server.inject({ method: 'put', url: `/activities/${activity2.id}/promote`, credentials: user }).then((res) => {

      expect(res.statusCode).to.equal(200);
      return res.result;
    }).then((result) => {

      expect(result.id).to.equal(activity2.id);
      expect(result.aliases).to.include({ id: activity1.id });
      expect(result.aliases).to.not.include({ id: activity3.id });
    });
  });

  it('does not find invalid activity', () => {

    return server.inject({ method: 'put', url: `/activities/${Faker.random.uuid()}/promote`, credentials: user }).then((res) => {

      expect(res.statusCode).to.equal(404);
    });
  });
});
