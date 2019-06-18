'use strict';

const Faker = require('faker');

const Fixtures = require('../fixtures');

const { db, Server, expect } = Fixtures;

const lab = exports.lab = require('@hapi/lab').script();

const { before, after, describe, it } = lab;

describe('PUT /activities/{id}/promote', () => {

  let server;
  const user = Fixtures.user();
  const activity1 = Fixtures.activity({ user_id: user.id }, true);
  const activity2 = Fixtures.activity({ activity_id: activity1.id, user_id: user.id }, true);
  const activity3 = Fixtures.activity({ user_id: user.id });

  before(async () => {

    server = await Server;

    await db.users.insert(user);
    await Promise.all([
      db.activities.insert(activity1),
      db.activities.insert(activity3)
    ]);
    await db.activities.insert(activity2);
  });

  after(async () => {

    await db.users.destroy({ id: user.id });
  });

  it('promotes an activity', async () => {

    const res = await server.inject({ method: 'put', url: `/activities/${activity2.id}/promote`, auth: { strategy: 'jwt', credentials: user } });

    expect(res.statusCode).to.equal(200);
    const result = res.result;
    expect(result.id).to.equal(activity2.id);
    expect(result.aliases).to.part.include({ id: activity1.id });
    expect(result.aliases).to.not.part.include({ id: activity3.id });
  });

  it('does not find invalid activity', async () => {

    const res = await server.inject({ method: 'put', url: `/activities/${Faker.random.uuid()}/promote`, auth: { strategy: 'jwt', credentials: user } });

    expect(res.statusCode).to.equal(404);
  });
});
