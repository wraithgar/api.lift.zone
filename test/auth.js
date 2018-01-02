'use strict';

const Fixtures = require('./fixtures');

const db = Fixtures.db;
const Server = Fixtures.server;

const lab = exports.lab = require('lab').script();
const expect = require('code').expect;
const describe = lab.describe;
const it = lab.it;
const after = lab.afterEach;
const before = lab.beforeEach;

describe('auth', () => {

  let server;
  const user = Fixtures.user();
  before(() => {

    return Promise.all([
      Server,
      Fixtures.db.users.insert(user)
    ]).then((items) => {

      server = items[0];
    });
  });

  after(() => {

    return db.users.destroy({ id: user.id });
  });

  it('can make a request with a jwt (with and without JWT in the header)', () => {

    let token;
    return server.inject({ method: 'post', url: '/user/login', payload: { email: user.email, password: user.password } }).then((res) => {

      expect(res.statusCode).to.equal(201);
      return res.result;
    }).then((result) => {

      expect(result).to.be.an.object();
      expect(result.token).to.be.a.string();
      token = result.token;
      return server.inject({ method: 'get', url: '/user', headers: { authorization: token } });
    }).then((res) => {

      expect(res.statusCode).to.equal(200);
      return res.result;
    }).then((result) => {
      return server.inject({ method: 'get', url: '/user', headers: { authorization: `JWT ${token}` } });
    }).then((res) => {

      expect(res.statusCode).to.equal(200);
      return res.result;
    }).then((result) => {

      expect(result).to.be.an.object();
      expect(result).to.not.part.include(['hash']);
      expect(result.email).to.equal(user.email);
    });
  });

  it('does not allow a user to auth with a stale jwt after logging out', { timeout: 3000 }, () => {

    return server.inject({ method: 'post', url: '/user/login', payload: { email: user.email, password: user.password } }).then((res) => {

      expect(res.statusCode).to.equal(201);
      return res.result;
    }).then((result) => {

      expect(result).to.be.an.object();
      expect(result.token).to.be.a.string();
      return server.inject({ method: 'get', url: '/user', headers: { authorization: result.token } }).then((res) => {

        expect(res.statusCode).to.equal(200);
        return res.result;
      }).then((usr) => {

        expect(usr).to.be.an.object();
        expect(usr.email).to.equal(user.email);
        const later = new Date(Date.now() + 2500);
        return db.users.updateOne({ id: usr.id }, { logout: later });
      }).then(() => {

        return server.inject({ method: 'get', url: '/user', headers: { authorization: result.token } });
      }).then((res) => {

        expect(res.statusCode).to.equal(401);
      });
    });
  });

  it('fails auth when a user is set to inactive after logging in', () => {

    return server.inject({ method: 'post', url: '/user/login', payload: { email: user.email, password: user.password } }).then((res) => {

      expect(res.statusCode).to.equal(201);
      return res.result;
    }).then((result) => {

      expect(result).to.be.an.object();
      expect(result.token).to.be.a.string();
      return db.users.update({ id: user.id }, { active: false }).then(() => {

        return server.inject({ method: 'get', url: '/user', headers: { authorization: result.token } });
      }).then((res) => {

        expect(res.statusCode).to.equal(401);
      });
    });
  });
});
