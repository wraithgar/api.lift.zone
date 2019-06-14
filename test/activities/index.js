'use strict';

const Fixtures = require('../fixtures');

const { db, Server, lab_script, expect } = Fixtures;

const lab = exports.lab = lab_script;

const { before, after, describe, it } = lab;

describe('GET /activities', () => {

  let server;
  const user1 = Fixtures.user();
  const user2 = Fixtures.user();
  const activity1 = Fixtures.activity({ user_id: user1.id });
  const activity2 = Fixtures.activity({ user_id: user1.id }, true);
  const activity3 = Fixtures.activity({ user_id: user1.id, activity_id: activity2.id });
  const activity4 = Fixtures.activity({ user_id: user2.id });
  const activity5 = Fixtures.activity({ user_id: user1.id });
  const activity6 = Fixtures.activity({ user_id: user1.id });
  const activity7 = Fixtures.activity({ user_id: user1.id });
  const activity8 = Fixtures.activity({ user_id: user1.id });
  const activity9 = Fixtures.activity({ user_id: user1.id });
  const activity10 = Fixtures.activity({ user_id: user1.id });
  const activity11 = Fixtures.activity({ user_id: user1.id });
  const activity12 = Fixtures.activity({ user_id: user1.id });
  const activity13 = Fixtures.activity({ user_id: user1.id });

  before(async () => {

    server = await Server;
    await Promise.all([
      db.users.insert(user1),
      db.users.insert(user2)
    ]);
    await Promise.all([
      db.activities.insert(activity1),
      db.activities.insert(activity2),
      db.activities.insert(activity4),
      db.activities.insert(activity5),
      db.activities.insert(activity6),
      db.activities.insert(activity7),
      db.activities.insert(activity8),
      db.activities.insert(activity9),
      db.activities.insert(activity10),
      db.activities.insert(activity11),
      db.activities.insert(activity12),
      db.activities.insert(activity13)
    ]);
    await db.activities.insert(activity3);
  });

  after(async () => {

    await Promise.all([
      db.users.destroy({ id: user1.id }),
      db.users.destroy({ id: user2.id })
    ]);
  });

  it('lists activities for a user', async () => {

    const res = await server.inject({ method: 'get', url: '/activities', auth: { strategy: 'jwt', credentials: user1 } });

    expect(res.statusCode).to.equal(206);
    expect(res.headers).to.include('link');
    expect(res.headers['content-range']).to.equal('0-9/11');
    expect(res.result).to.have.length(10);
  });

  it('lists all activities for a user', async () => {

    const res = await server.inject({ method: 'get', url: '/activities?limit=20', auth: { strategy: 'jwt', credentials: user1 } });

    expect(res.statusCode).to.equal(200);
    const result = res.result;
    expect(result).to.not.part.include(activity1);
    expect(result).to.not.part.include(activity2);
    expect(result).to.part.include({ name: activity1.name, aliases: [] });
    expect(result).to.part.include({ id: activity2.id, aliases: [{ name: activity3.name }] });
    expect(result).to.not.part.include(activity3);
    expect(result).to.not.part.include(activity4);
  });
});
