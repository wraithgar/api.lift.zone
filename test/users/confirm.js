'use strict';

const Faker = require('faker');

const Fixtures = require('../fixtures');

const { db, Server, lab_script, expect } = Fixtures;

const lab = exports.lab = lab_script;

const { before, after, describe, it } = lab;

describe('POST /user/confirm', () => {

  let server;
  const user1 = Fixtures.user({ validated: false });
  const user2 = Fixtures.user({ validated: false });
  const validation1 = Fixtures.validation({ user_id: user1.id });
  const validation2 = Fixtures.validation({ user_id: user2.id, created_at: Faker.date.past(1, new Date(Date.now() + 86401000)) });

  before(async () => {

    server = await Server;
    await Promise.all([
      db.users.insert(user1),
      db.users.insert(user2)
    ]);
    await Promise.all([
      db.validations.insert(validation1),
      db.validations.insert(validation2)
    ]);
  });

  after(async () => {

    await Promise.all([
      db.users.destroy({ id: user1.id }),
      db.users.destroy({ id: user2.id })
    ]);
  });

  it('confirms user', async () => {

    const res = await server.inject({ method: 'post', url: '/user/confirm', auth: { strategy: 'jwt', credentials: user1 }, payload: { token: validation1.token } });

    expect(res.statusCode).to.equal(200);
    const result = res.result;
    expect(result.validated).to.equal(true);
    expect(result).to.not.include('hash');
    const updatedUser = await db.users.findOne({ id: user1.id });
    expect(updatedUser.validated).to.equal(true);
    const existingValidation = await db.validations.findOne({ user_id: user1.id });
    expect(existingValidation).to.not.exist();
  });

  it('ignores invalid token', async () => {

    const res = await server.inject({ method: 'post', url: '/user/confirm', auth: { strategy: 'jwt', credentials: user2 }, payload: { token: Faker.random.uuid() } });

    expect(res.statusCode).to.equal(404);
    const updatedUser = await db.users.findOne({ id: user2.id });
    expect(updatedUser.validated).to.equal(false);
  });

  it('ignores old token', async () => {

    const res = await server.inject({ method: 'post', url: '/user/confirm', auth: { strategy: 'jwt', credentials: user2 }, payload: { token: validation2.token } });
    expect(res.statusCode).to.equal(404);
    const updatedUser = await db.users.findOne({ id: user2.id });
    expect(updatedUser.validated).to.equal(false);
  });
});
