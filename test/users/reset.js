'use strict';

const Faker = require('faker');

const Fixtures = require('../fixtures');

const { db, Server, lab_script, expect } = Fixtures;

const lab = exports.lab = lab_script;

const { before, after, describe, it } = lab;

describe('POST /user/reset', () => {

  let server;
  const user = Fixtures.user({ logout: Faker.date.past() });
  const recovery = Fixtures.recovery({ email: user.email });
  before(async () => {

    server = await Server;
    await db.users.insert(user)
    await db.recoveries.insert(recovery);
  });

  after(async () => {

    await db.users.destroy({ id: user.id });
  });

  it('resets password', async () => {

    const newPassword = Faker.internet.password();
    let res = await server.inject({ method: 'post', url: '/user/reset', auth: { strategy: 'jwt', credentials: user }, payload: { token: recovery.token, password: newPassword, passwordConfirm: newPassword } });

    expect(res.statusCode).to.equal(201);
    expect(res.result).to.include(['token']);
    const resetUser = await db.users.findOne({ id: user.id });
    expect(resetUser.hash).to.not.equal(user.hash);
    expect(resetUser.logout).to.be.above(user.logout);
    res = await server.inject({ method: 'get', url: '/user', headers: { authorization: res.result.token } });

    expect(res.statusCode).to.equal(200);
    expect(res.result.id).to.equal(user.id);
    const deletedRecovery = await db.recoveries.findOne({ token: recovery.token });
    expect(deletedRecovery).to.not.exist();
  });

  it('rejects invalid token', async () => {

    const newPassword = Faker.internet.password();
    const res = await server.inject({ method: 'post', url: '/user/reset', auth: { strategy: 'jwt', credentials: user }, payload: { token: Faker.random.uuid(), password: newPassword, passwordConfirm: newPassword } });

    expect(res.statusCode).to.equal(404);
  });
});
