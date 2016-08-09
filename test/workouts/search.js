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

describe('GET /search/workouts/{year}', () => {

  let server;
  const user = Fixtures.user();
  const workout = Fixtures.workout({ user_id: user.id }, true);

  before(() => {

    return Promise.all([
      Server,
      db.users.insert(user)
    ]).then((items) => {

      server = items[0];
      return Promise.all([
        db.workouts.insert(workout)
      ]);
    });
  });

  after(() => {

    return Promise.all([
      db.users.destroy({ id: user.id })
    ]);
  });

  it('gets a workout', () => {

    const year = workout.date.split('-')[0];
    return server.inject({ method: 'get', url: `/search/workouts/${year}`, credentials: user }).then((res) => {

      expect(res.statusCode).to.equal(200);
      return res.result;
    }).then((result) => {

      expect(result[workout.date]).to.include({ id: workout.id, name: workout.name });
    });
  });

  it('does not find nonexistant workout', () => {

    const year = Number(workout.date.split('-')[0]) + 1;
    return server.inject({ method: 'get', url: `/search/workouts/${year}`, credentials: user }).then((res) => {

      expect(res.statusCode).to.equal(200);
      return res.result;
    }).then((result) => {

      expect(result).to.not.include({ id: workout.id, name: workout.name });
    });
  });
});
