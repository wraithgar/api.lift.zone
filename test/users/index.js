'use strict';

const Bcrypt = require('bcrypt');
const Config = require('getconfig');
const Fixtures = require('../fixtures');
const Faker = require('faker');

const db = Fixtures.db;
const Server = Fixtures.server;

const lab = exports.lab = require('lab').script();
const expect = require('code').expect;

const before = lab.before;
const after = lab.after;
const describe = lab.describe;
const it = lab.it;

describe('GET /user', () => {

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

  it('requires auth', () => {

    return server.inject({ method: 'get', url: '/user' }).then((res) => {

      expect(res.statusCode).to.equal(401);
    });
  });

  it('can get user', () => {

    return server.inject({ method: 'get', url: '/user', auth: { strategy: 'jwt', credentials: user } }).then((res) => {

      expect(res.statusCode).to.equal(200);
      return res.result;
    }).then((result) => {

      expect(result).to.be.an.object();
      expect(result).to.equal(user);
    });
  });
});

describe('PATCH /user', () => {

  let server;
  const user = Fixtures.user();
  before(() => {

    return Promise.all([
      Server,
      Bcrypt.hash(user.password, Config.saltRounds)
    ]).then((items) => {

      user.hash = items[1];
      server = items[0];
      return db.users.insert(user);
    });
  });

  after(() => {

    return db.users.destroy({ id: user.id });
  });

  it('can update user', () => {

    const name = Faker.name.findName();
    return server.inject({ method: 'patch', url: '/user', payload: { name, currentPassword: user.password }, auth: { strategy: 'jwt', credentials: user } }).then((res) => {

      expect(res.statusCode).to.equal(200);
      return res.result;
    }).then((result) => {

      expect(result).to.contain(['id', 'name', 'email', 'validated']);
      expect(result).to.not.contain(['hash']);
      expect(result.id).to.equal(user.id);
      expect(result.name).to.equal(name);
      return db.users.findOne({ id: user.id }).then((updatedUser) => {

        expect(updatedUser.name).to.equal(name);
        expect(updatedUser.validated).to.equal(true);
      });
    });
  });

  it('invalidates on email change', () => {

    const email = Faker.internet.email();
    return server.inject({ method: 'patch', url: '/user', payload: { email, currentPassword: user.password }, auth: { strategy: 'jwt', credentials: user } }).then((res) => {

      expect(res.statusCode).to.equal(200);
      return res.result;
    }).then((result) => {

      expect(result).to.contain(['id', 'name', 'email', 'validated']);
      expect(result).to.not.contain(['hash']);
      expect(result.id).to.equal(user.id);
      expect(result.email).to.equal(email);
      return db.users.findOne({ id: user.id }).then((updatedUser) => {

        expect(updatedUser.email).to.equal(email);
        expect(updatedUser.validated).to.equal(false);
        user.email = email; //Make other tests pass now
      });
    });
  });

  it('changes password', () => {

    const password = Faker.internet.password();
    return server.inject({ method: 'patch', url: '/user', payload: { newPassword: password, confirmPassword: password, currentPassword: user.password }, auth: { strategy: 'jwt', credentials: user } }).then((res) => {

      expect(res.statusCode).to.equal(200);
      return res.result;
    }).then((result) => {

      expect(result).to.contain(['id', 'name', 'email', 'validated']);
      expect(result).to.not.contain(['hash']);
      expect(result.id).to.equal(user.id);
      return db.users.findOne({ id: user.id }).then((updatedUser) => {

        expect(updatedUser.hash).to.not.equal(user.hash);
      });
    });
  });

  it('requires valid password', () => {

    const email = Faker.internet.email();
    return server.inject({ method: 'patch', url: '/user', payload: { email, currentPassword: Faker.internet.password() }, auth: { strategy: 'jwt', credentials: user } }).then((res) => {

      expect(res.statusCode).to.equal(400);
    });
  });
});
