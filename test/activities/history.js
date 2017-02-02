'use strict';

const Faker = require('faker');

const Fixtures = require('../fixtures');

const db = Fixtures.db;
const Server = Fixtures.server;

const lab = exports.lab = require('lab').script();
const expect = require('code').expect;

const before = lab.before;
const after = lab.after;
const describe = lab.describe;
const it = lab.it;

describe('GET /activities/{id}/history', () => {

  let server;
  const user = Fixtures.user();
  const activity1 = Fixtures.activity({ user_id: user.id, sets: [{ reps: 4 }] }, true);
  const activity2 = Fixtures.activity({ user_id: user.id, activity_id: activity1.id, sets: [{ reps: 5 }] }, true);
  const activity3 = Fixtures.activity({ user_id: user.id }, true);
  const activity4 = Fixtures.activity({ user_id: user.id }, true);
  const workout1 = Fixtures.workout({ user_id: user.id, activities: [activity1] }, true);
  const workout2 = Fixtures.workout({ user_id: user.id, activities: [activity2] }, true);
  const workout3 = Fixtures.workout({ user_id: user.id, activities: [activity3] }, true);

  before(() => {

    return Promise.all([
      Server,
      db.users.insert(user)
    ]).then((items) => {

      server = items[0];
      return db.activities.insert(activity1);
    }).then(() => {

      return Promise.all([
        db.activities.insert(activity2),
        db.activities.insert(activity3),
        db.activities.insert(activity4)
      ]);
    }).then(() => {

      return Promise.all([
        db.workouts.insert(workout1),
        db.workouts.insert(workout2),
        db.workouts.insert(workout3)
      ]);
    });
  });

  after(() => {

    return Promise.all([
      db.users.destroy({ id: user.id })
    ]);
  });

  it('gets history for an activity', () => {

    return server.inject({ method: 'get', url: `/activities/${activity1.id}/history`, credentials: user }).then((res) => {

      expect(res.statusCode).to.equal(200);
      expect(res.headers).to.include('link');
      expect(res.headers['content-range']).to.equal('0-1/2');
      return res.result;
    }).then((result) => {

      expect(result).to.part.include([{ workout_name: workout1.name, sets: [{ reps: 4 }] }]);
      expect(result).to.part.include([{ workout_name: workout2.name, sets: [{ reps: 5 }] }]);
      expect(result).to.not.part.include([{ workout_name: workout3.name }]);
    });
  });

  it('does not find nonexistant activity', () => {

    return server.inject({ method: 'get', url: `/activities/${Faker.random.uuid()}/history`, credentials: user }).then((res) => {

      expect(res.statusCode).to.equal(404);
    });
  });

  it('gets history for a now aliased activity', () => {

    return server.inject({ method: 'get', url: `/activities/${activity2.id}/history?page=1`, credentials: user }).then((res) => {

      expect(res.statusCode).to.equal(200);
      expect(res.headers).to.include('link');
      expect(res.headers['content-range']).to.equal('0-1/2');
      return res.result;
    }).then((result) => {

      expect(result).to.part.include([{ workout_name: workout1.name, sets: [{ reps: 4 }] }]);
      expect(result).to.part.include([{ workout_name: workout2.name, sets: [{ reps: 5 }] }]);
      expect(result).to.not.part.include([{ workout_name: workout3.name }]);
    });
  });

  it('gets history for an activity with no workouts', () => {

    return server.inject({ method: 'get', url: `/activities/${activity4.id}/history`, credentials: user }).then((res) => {

      expect(res.statusCode).to.equal(200);
      expect(res.headers).to.include('link');
      expect(res.headers['content-range']).to.equal('0--1/0');
      return res.result;
    }).then((result) => {

      expect(result).to.equal([]);
    });
  });
});
