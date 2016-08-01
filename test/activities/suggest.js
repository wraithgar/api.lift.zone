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
  const activity1 = Fixtures.activity({ name: 'Barbell Squat', user_id: user.id });
  const activity2 = Fixtures.activity({ name: 'Front Squat', user_id: user.id });
  const activity3 = Fixtures.activity({ name: 'Squat', user_id: user.id, activity_id: activity1.id });

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

  it('finds matches', () => {

    return server.inject({ method: 'get', url: '/suggest/activities/Barbell%20Squat', credentials: user }).then((res) => {

      expect(res.statusCode).to.equal(200);
      return res.result;
    }).then((payload) => {

      expect(payload).to.have.length(3);
      expect(payload).to.include([{ id: activity1.id, name: 'Squat' }, { id: activity2.id, name: 'Front Squat' }, { id: activity1.id, name: 'Barbell Squat' }]);
    });
  });
});
