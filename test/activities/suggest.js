'use strict';

const Faker = require('faker');

const Fixtures = require('../fixtures');

const { db, Server, expect } = Fixtures;

const lab = exports.lab = require('@hapi/lab').script();

const { before, after, describe, it } = lab;

describe('GET /suggest/activities/{name}', () => {

  let server;
  const user = Fixtures.user();
  const activity1 = Fixtures.activity({ name: 'Barbell Squat', user_id: user.id }, true);
  const activity2 = Fixtures.activity({ name: 'Front Squat', user_id: user.id }, true);
  const activity3 = Fixtures.activity({ name: 'Squat', user_id: user.id, activity_id: activity1.id }, true);

  activity2.activity_id = activity2.id;
  activity2.activity_id = activity2.id;

  before(async () => {

    server = await Server;
    await db.users.insert(user)
    await Promise.all([
      db.activities.insert(activity1),
      db.activities.insert(activity2)
    ]);
    await db.activities.insert(activity3);
  });

  after(async () => {

    await db.users.destroy({ id: user.id });
  });

  it('finds suggestions', async () => {

    const res = await server.inject({ method: 'get', url: '/suggest/activities/Hack%20Squat', auth: { strategy: 'jwt', credentials: user } });

    expect(res.statusCode).to.equal(200);
    expect(res.result).to.part.include({ suggestions: [{ activity_id: activity1.id, name: 'Squat' }, { activity_id: activity2.id, name: 'Front Squat' }, { activity_id: activity1.id, name: 'Barbell Squat' }] });
  });

  it('finds a match', async () => {

    const res = await server.inject({ method: 'get', url: '/suggest/activities/Barbell%20Squat', auth: { strategy: 'jwt', credentials: user } });

    expect(res.statusCode).to.equal(200);
    expect(res.result).to.include({ id: activity1.id, name: activity1.name });
  });
});
