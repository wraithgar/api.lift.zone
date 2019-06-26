'use strict';

const Fixtures = require('../fixtures');

const { db, Server, expect } = Fixtures;

const lab = (exports.lab = require('@hapi/lab').script());

const { before, after, describe, it } = lab;

describe('POST /workouts', () => {
  let server;
  const user1 = Fixtures.user();
  const user2 = Fixtures.user();
  const workout1 = Fixtures.workout();
  const workout2 = Fixtures.workout({ user_id: user1.id }, false, [
    workout1.date
  ]);
  const workout3 = Fixtures.workout({ date: workout2.date });
  const workout4 = Fixtures.workout({ date: workout1.date, user_id: user2.id });

  before(async () => {
    server = await Server;
    await Promise.all([db.users.insert(user1), db.users.insert(user2)]);
    await Promise.all([
      db.workouts.insert(workout2),
      db.workouts.insert(workout4)
    ]);
  });

  after(async () => {
    await Promise.all([
      db.users.destroy({ id: user1.id }),
      db.users.destroy({ id: user2.id })
    ]);
  });

  it('creates a workout', async () => {
    const res = await server.inject({
      method: 'post',
      url: '/workouts',
      payload: workout1,
      auth: { strategy: 'jwt', credentials: user1 }
    });
    expect(res.statusCode).to.equal(201);
    expect(res.result).to.include({ name: workout1.name });
    const createdWorkout = await db.workouts.findOne({ id: res.result.id });
    expect(createdWorkout).to.exist();
  });

  it('does not create workout for same day', async () => {
    const res = await server.inject({
      method: 'post',
      url: '/workouts',
      payload: workout3,
      auth: { strategy: 'jwt', credentials: user1 }
    });
    expect(res.statusCode).to.equal(409);
  });
});
