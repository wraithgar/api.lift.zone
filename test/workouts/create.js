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

describe('POST /workouts', () => {

  let server;
  const user = Fixtures.user();
  const workout1 = Fixtures.workout();
  const workout2 = Fixtures.workout({ user_id: user.id }, false, [workout1.date]);
  const workout3 = Fixtures.workout({ date: workout2.date });

  before(() => {

    return Promise.all([
      Server,
      db.users.insert(user)
    ]).then((items) => {

      server = items[0];
      return Promise.all([
        db.workouts.insert(workout2)
      ]);
    });
  });

  after(() => {

    return Promise.all([
      db.users.destroy({ id: user.id })
    ]);
  });

  it('creates a workout', () => {

    return server.inject({ method: 'post', url: '/workouts', payload: workout1, credentials: user }).then((res) => {

      expect(res.statusCode).to.equal(201);
      return res.result;
    }).then((result) => {

      expect(result).to.include({ name: workout1.name });
      return db.workouts.findOne({ id: result.id });
    }).then((createdWorkout) => {

      expect(createdWorkout).to.exist();
    });
  });

  it('does not create workout for same day', () => {

    return server.inject({ method: 'post', url: '/workouts', payload: workout3, credentials: user }).then((res) => {

      expect(res.statusCode).to.equal(409);
    });
  });
});
