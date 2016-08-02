'use strict';

const Server = require('../../server');
const Fixtures = require('../fixtures');
const Faker = require('faker');

const db = Fixtures.db;

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

    return server.inject({ method: 'get', url: '/user', credentials: user }).then((res) => {

      expect(res.statusCode).to.equal(200);
      return res.result;
    }).then((payload) => {

      expect(payload).to.be.an.object();
      expect(payload).to.equal(user);
    });
  });
});

describe('PATCH /user', () => {

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

  it('can update user', () => {

    const name = Faker.name.findName();
    return server.inject({ method: 'patch', url: '/user', payload: { name }, credentials: user }).then((res) => {

      expect(res.statusCode).to.equal(200);
      return res.result;
    }).then((payload) => {

      expect(payload).to.contain(['id', 'name', 'email', 'validated']);
      expect(payload).to.not.contain(['hash']);
      expect(payload.id).to.equal(user.id);
      expect(payload.name).to.equal(name);
      return db.users.findOne({ id: user.id }).then((updatedUser) => {

        expect(updatedUser.name).to.equal(name);
        expect(updatedUser.validated).to.equal(true);
      });
    });
  });

  it('invalidates on email change', () => {

    const email = Faker.internet.email();
    return server.inject({ method: 'patch', url: '/user', payload: { email }, credentials: user }).then((res) => {

      expect(res.statusCode).to.equal(200);
      return res.result;
    }).then((payload) => {

      expect(payload).to.contain(['id', 'name', 'email', 'validated']);
      expect(payload).to.not.contain(['hash']);
      expect(payload.id).to.equal(user.id);
      expect(payload.email).to.equal(email);
      return db.users.findOne({ id: user.id }).then((updatedUser) => {

        expect(updatedUser.email).to.equal(email);
        expect(updatedUser.validated).to.equal(false);
      });
    });
  });
});
