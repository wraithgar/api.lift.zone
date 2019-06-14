'use strict';

const Moment = require('moment');

const Faker = require('faker');

const Fixtures = require('../fixtures');

const { db, Server, expect } = Fixtures;

const lab = exports.lab = require('@hapi/lab').script();

const { before, after, describe, it } = lab;

describe('PUT /workouts', () => {

  let server;
  const user1 = Fixtures.user();
  const user2 = Fixtures.user();
  const workout1 = Fixtures.workout({ user_id: user1.id }, true);
  const workout2 = Fixtures.workout({ date: workout1.date, user_id: user2.id });
  const workout3 = Fixtures.workout({ id: workout1.id, date: workout1.date });
  const workout4 = Fixtures.workout({ user_id: user1.id }, true);
  const workout5 = Fixtures.workout({ date: workout4.date, id: workout4.id });

  before(async () => {

    server = await Server;
    await Promise.all([
      db.users.insert(user1),
      db.users.insert(user2)
    ]);
    await Promise.all([
      db.workouts.insert(workout1),
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

  it('updates a workout', async () => {

    const res = await server.inject({ method: 'put', url: `/workouts/${workout1.id}`, auth: { strategy: 'jwt', credentials: user1 }, payload: workout3 });

    expect(res.statusCode).to.equal(200);
    expect(res.result.id).to.equal(workout1.id);
    const updatedWorkout = await db.workouts.findOne({ id: workout1.id });
    expect(updatedWorkout.raw).to.equal(workout3.raw);
  });

  it('does not updated nonexistant workout', async () => {

    const res = await server.inject({ method: 'put', url: `/workouts/${Faker.random.uuid()}`, auth: { strategy: 'jwt', credentials: user1 }, payload: Fixtures.workout({}, true) });

    expect(res.statusCode).to.equal(404);
  });

  it('does not update over existing date', async () => {

    const res = await server.inject({ method: 'put', url: `/workouts/${workout1.id}`, auth: { strategy: 'jwt', credentials: user1 }, payload: workout5 });

    expect(res.statusCode).to.equal(409);
  });

  it('can update to a different date', async () => {

    let date = new Date(workout1.date);
    date.setYear(date.getFullYear() - 1);
    date = Moment(date).format('YYYY-MM-DD');
    const workout = Fixtures.workout({ date }, true);
    const res = await server.inject({ method: 'put', url: `/workouts/${workout1.id}`, auth: { strategy: 'jwt', credentials: user1 }, payload: workout });

    expect(res.statusCode).to.equal(200);
  });
});
