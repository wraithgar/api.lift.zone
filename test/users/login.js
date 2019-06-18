'use strict';

const Fixtures = require('../fixtures');

const { db, Server, expect } = Fixtures;

const lab = exports.lab = require('@hapi/lab').script();

const { before, after, describe, it } = lab;

describe('POST /user/login', () => {

  let server;
  const user = Fixtures.user();
  before(async () => {

    server = await Server;
    await db.users.insert(user);
  });

  after(async () => {

    await db.users.destroy({ id: user.id });
  });

  it('can login a user', async () => {

    const res = await server.inject({ method: 'post', url: '/user/login', payload: { email: user.email, password: user.password } });

    expect(res.statusCode).to.equal(201);
    const result = res.result;
    expect(result).to.not.part.include(['hash']);
    expect(result).to.be.an.object();
    expect(result.token).to.be.a.string();
  });

  it('IgNoReS cAsE', async () => {

    const res = await server.inject({ method: 'post', url: '/user/login', payload: { email: user.email.toUpperCase(), password: user.password } });
    expect(res.statusCode).to.equal(201);
    const result = res.result;
    expect(result).to.not.part.include(['hash']);
    expect(result).to.be.an.object();
    expect(result.token).to.be.a.string();
  });

  it('401 on invalid user', async () => {

    const res = await server.inject({ method: 'post', url: '/user/login', payload: { email: 'nobody@danger.computer', password: user.password } });
    expect(res.statusCode).to.equal(401);
  });

  it('401 on invalid password', async () => {

    const res = await server.inject({ method: 'post', url: '/user/login', payload: { email: user.email, password: 'invalidpassword' } });
    expect(res.statusCode).to.equal(401);
  });

  describe('inactive user', () => {

    before(async () => {

      await db.users.update({ id: user.id }, { active: false });
    });

    after(async () => {

      await db.users.update({ id: user.id }, { active: true });
    });

    it('can\'t log in', async () => {

      const res = await server.inject({ method: 'post', url: '/user/login', payload: { email: user.email, password: user.password } });
      expect(res.statusCode).to.equal(401);
    });
  });
});
