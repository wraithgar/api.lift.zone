'use strict';

const Bcrypt = require('bcrypt');
const Config = require('getconfig');
const Faker = require('faker');

const Fixtures = require('../fixtures');

const { db, Server, lab_script, expect } = Fixtures;

const lab = exports.lab = lab_script;

const { before, after, describe, it } = lab;

describe('GET /user', () => {

  let server;
  const user = Fixtures.user();
  before(async () => {

    server = await Server;
    await db.users.insert(user)
  });

  after(async () => {

    await db.users.destroy({ id: user.id });
  });

  it('requires auth', async () => {

    const res = await server.inject({ method: 'get', url: '/user' });

    expect(res.statusCode).to.equal(401);
  });

  it('can get user', async () => {

    const res = await server.inject({ method: 'get', url: '/user', auth: { strategy: 'jwt', credentials: user } });

    expect(res.statusCode).to.equal(200);
    const result = res.result;
    expect(result).to.be.an.object();
    expect(result).to.equal(user);
  });
});

describe('PATCH /user', () => {

  let server;
  const user = Fixtures.user();
  before(async () => {

    server = await Server;
    user.hash = await Bcrypt.hash(user.password, Config.saltRounds)
    await db.users.insert(user);
  });

  after(async () => {

    await db.users.destroy({ id: user.id });
  });

  it('can update user', async () => {

    const name = Faker.name.findName();
    const res = await server.inject({ method: 'patch', url: '/user', payload: { name, currentPassword: user.password }, auth: { strategy: 'jwt', credentials: user } });

    expect(res.statusCode).to.equal(200);
    const result = res.result;
    expect(result).to.contain(['id', 'name', 'email', 'validated']);
    expect(result).to.not.contain(['hash']);
    expect(result.id).to.equal(user.id);
    expect(result.name).to.equal(name);
    const updatedUser = await db.users.findOne({ id: user.id });

    expect(updatedUser.name).to.equal(name);
    expect(updatedUser.validated).to.equal(true);
  });

  it('invalidates on email change', async () => {

    const email = Faker.internet.email();
    const res = await server.inject({ method: 'patch', url: '/user', payload: { email, currentPassword: user.password }, auth: { strategy: 'jwt', credentials: user } });
    expect(res.statusCode).to.equal(200);
    const result = res.result;
    expect(result).to.contain(['id', 'name', 'email', 'validated']);
    expect(result).to.not.contain(['hash']);
    expect(result.id).to.equal(user.id);
    expect(result.email).to.equal(email);
    const updatedUser = await db.users.findOne({ id: user.id });

    expect(updatedUser.email).to.equal(email);
    expect(updatedUser.validated).to.equal(false);
    user.email = email; //Make other tests pass now
  });

  it('changes password', async () => {

    const password = Faker.internet.password();
    const res = await server.inject({ method: 'patch', url: '/user', payload: { newPassword: password, confirmPassword: password, currentPassword: user.password }, auth: { strategy: 'jwt', credentials: user } });

    expect(res.statusCode).to.equal(200);
    const result =  res.result;
    expect(result).to.contain(['id', 'name', 'email', 'validated']);
    expect(result).to.not.contain(['hash']);
    expect(result.id).to.equal(user.id);
    const updatedUser = await db.users.findOne({ id: user.id });

    expect(updatedUser.hash).to.not.equal(user.hash);
  });

  it('requires valid password', async () => {

    const email = Faker.internet.email();
    const res = await server.inject({ method: 'patch', url: '/user', payload: { email, currentPassword: Faker.internet.password() }, auth: { strategy: 'jwt', credentials: user } });

    expect(res.statusCode).to.equal(400);
  });
});
