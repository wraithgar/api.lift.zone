'use strict';

const Faker = require('faker');

const Fixtures = require('../fixtures');

const { db, Server, expect } = Fixtures;

const lab = exports.lab = require('@hapi/lab').script();

const { before, after, describe, it } = lab;

describe('DELETE /user', () => {

  let server;
  const keepUser = Fixtures.user();

  before(async () => {

    server = await Server;
    await db.users.insert(keepUser);
  });

  after(async () => {

    await db.users.destroy({ id: keepUser.id });
  });

  it('requires confirmation', async () => {

    const res = await server.inject({ method: 'delete', url: '/user', auth: { strategy: 'jwt', credentials: keepUser } });

    expect(res.statusCode).to.equal(400);
    const keptUser = await Fixtures.db.users.findOne({ id: keepUser.id });
    expect(keptUser).to.exist();
  });

  describe('deleting a user', () => {

    const user = Fixtures.user();

    before(async () => {

      await db.users.insert(user);
    });

    after(async () => {

      await db.users.destroy({ id: user.id });
    });

    it('deletes a user', async () => {

      const res = await server.inject({ method: 'delete', url: '/user?confirm=true', auth: { strategy: 'jwt', credentials: user } });

      expect(res.statusCode).to.equal(204);
      const deletedUser = await Fixtures.db.users.findOne({ id: user.id });
      const keptUser = await Fixtures.db.users.findOne({ id: keepUser.id });
      expect(deletedUser).to.not.exist();
      expect(keptUser).to.exist();
    });
  });
});
