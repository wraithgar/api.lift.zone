'use strict';

const Faker = require('faker');

const Fixtures = require('../fixtures');

const { db, Server, expect } = Fixtures;

const lab = exports.lab = require('@hapi/lab').script();

const { before, after, describe, it } = lab;

describe('GET /activities/{id}', () => {

  let server;
  const user1 = Fixtures.user();
  const user2 = Fixtures.user();
  const activity1 = Fixtures.activity({ user_id: user1.id }, true);
  const activity2 = Fixtures.activity({ user_id: user2.id }, true);

  before(async () => {

    server = await Server;
    await Promise.all([
      db.users.insert(user1),
      db.users.insert(user2)
    ]);
    await Promise.all([
      db.activities.insert(activity1),
      db.activities.insert(activity2)
    ]);
  });

  after(async () => {

    await Promise.all([
      db.users.destroy({ id: user1.id }),
      db.users.destroy({ id: user2.id })
    ]);
  });

  it('finds activity', async () => {

    const res = await server.inject({ method: 'get', url: `/activities/${activity1.id}`, auth: { credentials: user1, strategy: 'jwt' } });

    expect(res.statusCode).to.equal(200);
    expect(res.result).to.include({ id: activity1.id, name: activity1.name });
  });

  it('does not find other user\'s activity', async () => {

    const res = await server.inject({ method: 'get', url: `/activities/${activity2.id}`, auth: { credentials: user1, strategy: 'jwt' } });

    expect(res.statusCode).to.equal(404);
  });

  it('does not find nonexistant activity', async () => {

    const res = await server.inject({ method: 'get', url: `/activities/${Faker.random.uuid()}`, auth: { credentials: user1, strategy: 'jwt' } });

    expect(res.statusCode).to.equal(404);
  });
});
