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

describe('GET /workouts', () => {

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

  it('gets workouts', () => {

    return server.inject({ method: 'get', url: '/workouts', credentials: user }).then((res) => {

      expect(res.statusCode).to.equal(200);
      return res.result;
    }).then((result) => {

      expect(result).to.include({ id: workout.id, name: workout.name });
    });
  });

});
