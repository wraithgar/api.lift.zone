'use strict';

const Faker = require('faker');

const Fixtures = require('../fixtures');

const { db, Server, expect } = Fixtures;

const lab = exports.lab = require('@hapi/lab').script();

const { before, after, describe, it } = lab;

describe('DELETE /workouts/{id}', () => {

  let server;
  const user = Fixtures.user();
  const workout1 = Fixtures.workout({ user_id: user.id }, true);
  const workout2 = Fixtures.workout({ user_id: user.id }, true);

  before(async () => {

    server = await Server;
    await db.users.insert(user)
    await Promise.all([
      db.workouts.insert(workout1),
      db.workouts.insert(workout2)
    ]);
  });

  after(async () => {

    await db.users.destroy({ id: user.id })
  });

  it('deletes a workout', async () => {

    const res = await server.inject({ method: 'delete', url: `/workouts/${workout1.id}`, auth: { strategy: 'jwt', credentials: user } });
    expect(res.statusCode).to.equal(204);
    const deletedWorkout = await Fixtures.db.workouts.findOne({ id: workout1.id });
    expect(deletedWorkout).to.not.exist();
    const workout = await Fixtures.db.workouts.findOne({ id: workout2.id });
    expect(workout).to.exist();
  });

  it('does not delete nonexistant workout', async () => {

    const res = await server.inject({ method: 'delete', url: `/workouts/${Faker.random.uuid()}`, auth: { strategy: 'jwt', credentials: user } });
    expect(res.statusCode).to.equal(404);
  });
});
