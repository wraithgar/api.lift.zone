'use strict';

const Fixtures = require('../../fixtures');

const { db, Server, expect } = Fixtures;

const lab = (exports.lab = require('@hapi/lab').script());

const { before, after, describe, it } = lab;

describe('GET /admin/users', () => {
  let server;
  const admin = Fixtures.user({ scope: ['admin'] });
  const user = Fixtures.user();
  const activity = Fixtures.activity({ user_id: user.id });
  const workout = Fixtures.workout({ user_id: user.id });

  before(async () => {
    server = await Server;

    await Promise.all([db.users.insert(admin), db.users.insert(user)]);
    await Promise.all([
      db.activities.insert(activity),
      db.workouts.insert(workout)
    ]);
  });

  after(async () => {
    await Promise.all([
      db.users.destroy({ id: admin.id }),
      db.users.destroy({ id: user.id })
    ]);
  });

  it('lists users', async () => {
    const res = await server.inject({
      method: 'get',
      url: '/admin/users',
      auth: { strategy: 'jwt', credentials: admin }
    });

    expect(res.statusCode).to.equal(200);
    const result = res.result;
    expect(result).to.once.part.include({
      id: user.id,
      workouts: 1,
      activities: 1
    });
    expect(result).to.once.part.include({
      id: admin.id,
      workouts: 0,
      activities: 0
    });
  });

  it('requires admin', async () => {
    const res = await server.inject({
      method: 'get',
      url: '/admin/users',
      auth: { strategy: 'jwt', credentials: user }
    });

    expect(res.statusCode).to.equal(403);
  });
});
