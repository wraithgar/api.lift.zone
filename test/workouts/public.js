'use strict';

const Faker = require('faker');

const Fixtures = require('../fixtures');

const { db, Server, lab_script, expect } = Fixtures;

const lab = exports.lab = lab_script;

const { before, after, describe, it } = lab;

describe('GET /public/workouts/{id}', () => {

  let server;
  const privateUser = Fixtures.user();
  const publicUser = Fixtures.user({ preferences: { visible: true } });
  const workout1 = Fixtures.workout({ user_id: privateUser.id }, true);
  const workout2 = Fixtures.workout({ user_id: privateUser.id, visible: true }, true);
  const workout3 = Fixtures.workout({ user_id: privateUser.id, visible: false }, true);
  const workout4 = Fixtures.workout({ user_id: publicUser.id }, true);
  const workout5 = Fixtures.workout({ user_id: publicUser.id, visible: true }, true);
  const workout6 = Fixtures.workout({ user_id: publicUser.id, visible: false }, true);

  before(async () => {

    server = await Server;
    await Promise.all([
      db.users.insert(privateUser),
      db.users.insert(publicUser)
    ]);
    await Promise.all([
      db.workouts.insert(workout1),
      db.workouts.insert(workout2),
      db.workouts.insert(workout3),
      db.workouts.insert(workout4),
      db.workouts.insert(workout5),
      db.workouts.insert(workout6)
    ]);
  });

  after(async () => {

    await Promise.all([
      db.users.destroy({ id: privateUser.id }),
      db.users.destroy({ id: publicUser.id })
    ]);
  });

  it('does not get a default visibility workout for a user that is not visible', async () => {

    const res = await server.inject({ method: 'get', url: `/public/workouts/${workout1.id}` });

    expect(res.statusCode).to.equal(404);
  });

  it('gets a workout that is visible for a user that is not visible', async () => {

    const res = await server.inject({ method: 'get', url: `/public/workouts/${workout2.id}` });

    expect(res.statusCode).to.equal(200);
    const result = res.result;
    expect(result.id).to.equal(workout2.id);
    expect(result).to.not.part.include(['user_id']);
  });

  it('does not get a workout that is not visible for a user that is not visible', async () => {

    const res = await server.inject({ method: 'get', url: `/public/workouts/${workout3.id}` });

    expect(res.statusCode).to.equal(404);
  });

  it('gets a default visibility workout for a user that is visible', async () => {

    const res = await server.inject({ method: 'get', url: `/public/workouts/${workout4.id}` });

    expect(res.statusCode).to.equal(200);
    const result = res.result;
    expect(result.id).to.equal(workout4.id);
    expect(result).to.not.part.include(['user_id']);
  });

  it('gets a workout that is visible for a user that is visible', async () => {

    const res = await server.inject({ method: 'get', url: `/public/workouts/${workout5.id}` });

    expect(res.statusCode).to.equal(200);
    const result = res.result;
    expect(result.id).to.equal(workout5.id);
    expect(result).to.not.part.include(['user_id']);
  });

  it('does not get a workout that is not visible for a user that is visible', async () => {

    const res = await server.inject({ method: 'get', url: `/public/workouts/${workout6.id}` });

    expect(res.statusCode).to.equal(404);
  });
});
