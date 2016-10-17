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

describe('POST /user/login', () => {

  let server;
  const user = Fixtures.user();
  before(() => {

    return Promise.all([
      Server,
      db.users.insert(user)
    ]).then((items) => {

      server = items[0];
    });
  });

  after(() => {

    return db.users.destroy({ id: user.id });
  });

  it('can login a user', () => {

    return server.inject({ method: 'post', url: '/user/login', payload: { email: user.email, password: user.password } }).then((res) => {

      expect(res.statusCode).to.equal(201);
      return res.result;
    }).then((result) => {

      expect(result).to.not.part.include(['hash']);
      expect(result).to.be.an.object();
      expect(result.token).to.be.a.string();
    });
  });

  it('IgNoReS cAsE', () => {

    return server.inject({ method: 'post', url: '/user/login', payload: { email: user.email.toUpperCase(), password: user.password } }).then((res) => {

      expect(res.statusCode).to.equal(201);
      return res.result;
    }).then((result) => {

      expect(result).to.not.part.include(['hash']);
      expect(result).to.be.an.object();
      expect(result.token).to.be.a.string();
    });
  });

  it('401 on invalid user', () => {

    return server.inject({ method: 'post', url: '/user/login', payload: { email: 'nobody@danger.computer', password: user.password } }).then((res) => {

      expect(res.statusCode).to.equal(401);
    });
  });

  it('401 on invalid password', () => {

    return server.inject({ method: 'post', url: '/user/login', payload: { email: user.email, password: 'invalidpassword' } }).then((res) => {

      expect(res.statusCode).to.equal(401);
    });
  });

  describe('inactive user', () => {

    before(() => {

      return db.users.update({ id: user.id }, { active: false });
    });

    after(() => {

      return db.users.update({ id: user.id }, { active: true });
    });

    it('can\'t log in', () => {

      return server.inject({ method: 'post', url: '/user/login', payload: { email: user.email, password: user.password } }).then((res) => {

        expect(res.statusCode).to.equal(401);
      });
    });
  });
});
