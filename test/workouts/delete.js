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

describe('DELETE /workouts/{id}', () => {

  let server;
  const user = Fixtures.user();
  const workout1 = Fixtures.workout({ user_id: user.id }, true);
  const workout2 = Fixtures.workout({ user_id: user.id }, true);

  before(() => {

    return Promise.all([
      Server,
      db.users.insert(user)
    ]).then((items) => {

      server = items[0];
      return Promise.all([
        db.workouts.insert(workout1),
        db.workouts.insert(workout2)
      ]);
    });
  });

  after(() => {

    return Promise.all([
      db.users.destroy({ id: user.id })
    ]);
  });

  it('deletes a workout', () => {

    return server.inject({ method: 'delete', url: `/workouts/${workout1.id}`, credentials: user }).then((res) => {

      expect(res.statusCode).to.equal(204);
      return Fixtures.db.workouts.findOne({ id: workout1.id });
    }).then((deletedWorkout) => {

      expect(deletedWorkout).to.not.exist();
      return Fixtures.db.workouts.findOne({ id: workout2.id });
    }).then((workout) => {

      expect(workout).to.exist();
    });
  });

  it('does not delete nonexistant workout', () => {

    return server.inject({ method: 'delete', url: `/workouts/${Faker.random.uuid()}`, credentials: user }).then((res) => {

      expect(res.statusCode).to.equal(404);
    });
  });
});
