'use strict';

const Fixtures = require('../fixtures');

const { db, Server, expect } = Fixtures;

const lab = exports.lab = require('@hapi/lab').script();

const { before, after, describe, it } = lab;


describe('POST /activities/{id}', () => {

  let server;
  const user1 = Fixtures.user();
  const user2 = Fixtures.user();
  const activity1 = Fixtures.activity();
  const activity2 = Fixtures.activity({ activity_id: Fixtures.uuid() });
  const activity3 = Fixtures.activity({ user_id: user1.id }, true);
  const activity4 = Fixtures.activity({ activity_id: activity3.id });

  before(async () => {

    server = await Server;
    await Promise.all([
      db.users.insert(user1),
      db.users.insert(user2)
    ]);
    await db.activities.insert(activity3)
  });

  after(async () => {

    await Promise.all([
      db.users.destroy({ id: user1.id }),
      db.users.destroy({ id: user2.id })
    ]);
  });

  it('creates an activity', async () => {

    const res = await server.inject({ method: 'post', url: '/activities', auth: { credentials: user1, strategy: 'jwt' }, payload: activity1 });

    expect(res.statusCode).to.equal(201);
    expect(res.result).to.include(activity1);
  });

  it('404 on invalid activity_id', async () => {

    const res = await server.inject({ method: 'post', url: '/activities', auth: { credentials: user1, strategy: 'jwt' }, payload: activity2 });

    expect(res.statusCode).to.equal(404);
  });

  it("does not find other user's activity", async () => {

    const res = await server.inject({ method: 'post', url: '/activities', auth: { credentials: user2, strategy: 'jwt' }, payload: activity4 });

    expect(res.statusCode).to.equal(404);
  });

  it('creates alias', async () => {

    const res = await server.inject({ method: 'post', url: '/activities', auth: { credentials: user1, strategy: 'jwt' }, payload: activity4 });

    expect(res.statusCode).to.equal(201);
    expect(res.result).to.include(activity4);
  });
});
