'use strict';

const Server = require('../../server');
const Fixtures = require('../fixtures');

const db = Fixtures.db;

const lab = exports.lab = require('lab').script();
const expect = require('code').expect;

const before = lab.before;
const after = lab.after;
const describe = lab.describe;
const it = lab.it;

describe('POST /user/signup', () => {

  let server;
  const user = Fixtures.user();
  const invite1 = Fixtures.invite({ user_id: user.id });
  const invite2 = Fixtures.invite({ user_id: user.id, claimed_by: user.id });
  const signupUser1 = Fixtures.user();
  const signupUser2 = Fixtures.user();
  before(() => {

    return Promise.all([
      Server,
      db.users.insert(user)
    ]).then((items) => {

      server = items[0];
      return Promise.all([
        db.invites.insert(invite1),
        db.invites.insert(invite2)
      ]);
    });
  });

  after(() => {

    return Promise.all([
      db.users.destroy({ id: user.id }),
      db.users.destroy({ email: signupUser1.email }),
      db.users.destroy({ email: signupUser2.email })
    ]);
  });

  it('creates a user', () => {

    const signup = {
      invite: invite1.token,
      name: signupUser1.name,
      email: signupUser1.email,
      password: signupUser1.password,
      passwordConfirm: signupUser1.password
    };

    return server.inject({ method: 'post', url: '/user/signup', payload: signup }).then((res) => {

      expect(res.statusCode).to.equal(201);
      return res.result;
    }).then((payload) => {

      expect(payload).to.include(['token']);
      return db.users.findOne({ email: signupUser1.email }).then((newUser) => {

        expect(newUser).to.exist();
        return server.inject({ method: 'get', url: '/user', headers: { authorization: payload.token } }).then((newRes) => {

          expect(newRes.statusCode).to.equal(200);
          return newRes.result;
        }).then((newPayload) => {

          expect(newPayload.email).to.equal(signupUser1.email);
        });
      });
    });
  });

  it('rejects claimed invite', () => {

    const signup = {
      invite: invite2.token,
      name: signupUser2.name,
      email: signupUser2.email,
      password: signupUser2.password,
      passwordConfirm: signupUser2.password
    };

    return server.inject({ method: 'post', url: '/user/signup', payload: signup }).then((res) => {

      expect(res.statusCode).to.equal(404);
      return db.users.findOne({ email: signupUser2.email });
    }).then((newUser) => {

      expect(newUser).to.not.exist();
    });
  });
});

