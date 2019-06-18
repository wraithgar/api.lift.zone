'use strict';

const Fixtures = require('../fixtures');

const { db, Server, expect } = Fixtures;

const lab = exports.lab = require('@hapi/lab').script();

const { before, after, describe, it } = lab;

describe('POST /user/signup', () => {

  let server;
  const user = Fixtures.user();
  const invite1 = Fixtures.invite({ user_id: user.id });
  const invite2 = Fixtures.invite({ user_id: user.id, claimed_by: user.id });
  const signupUser1 = Fixtures.user();
  const signupUser2 = Fixtures.user();
  before(async () => {

    server = await Server;
    await db.users.insert(user);
    await Promise.all([
      db.invites.insert(invite1),
      db.invites.insert(invite2)
    ]);
  });

  after(async () => {

    await Promise.all([
      db.users.destroy({ id: user.id }),
      db.users.destroy({ email: signupUser1.email }),
      db.users.destroy({ email: signupUser2.email })
    ]);
  });

  it('creates a user', async () => {

    const signup = {
      invite: invite1.token,
      name: signupUser1.name,
      email: signupUser1.email,
      password: signupUser1.password,
      passwordConfirm: signupUser1.password
    };

    let res = await server.inject({ method: 'post', url: '/user/signup', payload: signup });

    expect(res.statusCode).to.equal(201);
    let result = res.result;
    expect(result).to.include(['token']);
    const newUser = await db.users.findOne({ email: signupUser1.email });

    expect(newUser).to.exist();

    res = await server.inject({ method: 'get', url: '/user', headers: { authorization: result.token } });
    result = res.result;

    expect(res.statusCode).to.equal(200);
    expect(result.email).to.equal(signupUser1.email);
  });

  it('rejects claimed invite', async () => {

    const signup = {
      invite: invite2.token,
      name: signupUser2.name,
      email: signupUser2.email,
      password: signupUser2.password,
      passwordConfirm: signupUser2.password
    };

    const res = await server.inject({ method: 'post', url: '/user/signup', payload: signup });

    expect(res.statusCode).to.equal(404);
    const newUser = await db.users.findOne({ email: signupUser2.email });
    expect(newUser).to.not.exist();
  });
});
