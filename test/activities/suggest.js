'use strict';

const Server = require('../../server');
const Fixtures = require('../fixtures');

const db = Fixtures.db;

const lab = exports.lab = require('lab').script();
const expect = require('code').expect;

const before = lab.before;
const after = lab.after;
const describe = lab.describe;
const it = lab.it;

describe('GET /suggest/activities/{name}', () => {

  let server;
  const user = Fixtures.user();
  const activity1 = Fixtures.activity({ name: 'Barbell Squat', user_id: user.id }, true);
  const activity2 = Fixtures.activity({ name: 'Front Squat', user_id: user.id }, true);
  const activity3 = Fixtures.activity({ name: 'Squat', user_id: user.id, activity_id: activity1.id }, true);

  activity2.activity_id = activity2.id;
  activity2.activity_id = activity2.id;

  before(() => {

    return Promise.all([
      Server,
      db.users.insert(user)
    ]).then((items) => {

      server = items[0];
      return Promise.all([
        db.activities.insert(activity1),
        db.activities.insert(activity2)
      ]);
    }).then(() => {

      return db.activities.insert(activity3);
    });
  });

  after(() => {

    return db.users.destroy({ id: user.id });
  });

  it('finds suggestions', () => {

    return server.inject({ method: 'get', url: '/suggest/activities/Hack%20Squat', credentials: user }).then((res) => {

      expect(res.statusCode).to.equal(200);
      return res.result;
    }).then((payload) => {

      expect(payload).to.include({ suggestions: [{ activity_id: activity1.id, name: 'Squat' }, { activity_id: activity2.id, name: 'Front Squat' }, { activity_id: activity1.id, name: 'Barbell Squat' }] });
    });
  });

  it('finds a match', () => {

    return server.inject({ method: 'get', url: '/suggest/activities/Barbell%20Squat', credentials: user }).then((res) => {

      expect(res.statusCode).to.equal(200);
      return res.result;
    }).then((payload) => {

      expect(payload).to.include({ id: activity1.id, name: activity1.name });
    });
  });
});
