'use strict';

const Fixtures = require('../fixtures');

const { db, Server, expect } = Fixtures;

const lab = exports.lab = require('@hapi/lab').script();

const { before, after, describe, it } = lab;

describe('GET /user/invites', () => {

  let server;
  const user1 = Fixtures.user();
  const user2 = Fixtures.user({ validated: false });
  const invite1 = Fixtures.invite({ user_id: user1.id });
  const invite2 = Fixtures.invite({ user_id: user2.id });
  const invite3 = Fixtures.invite({ user_id: user1.id, claimed_by: user1.id });
  before(async () => {

    server = await Server;
    await Promise.all([
      db.users.insert(user1),
      db.users.insert(user2)
    ]);
    await Promise.all([
      db.invites.insert(invite1),
      db.invites.insert(invite2),
      db.invites.insert(invite3)
    ]);
  });

  after(async () => {

    await Promise.all([
      db.users.destroy({ id: user1.id }),
      db.users.destroy({ id: user2.id })
    ]);
  });

  it('lists invites', async () => {

    const res = await server.inject({ method: 'get', url: '/user/invites', auth: { strategy: 'jwt', credentials: user1 } });
    expect(res.statusCode).to.equal(200);
    expect(res.result).to.part.include({ token: invite1.token });
  });

  it('lists no invites if user not validated', async () => {

    const res = await server.inject({ method: 'get', url: '/user/invites', auth: { strategy: 'jwt', credentials: user2 } });

    expect(res.statusCode).to.equal(200);
    expect(res.result).to.be.empty();
  });
});
