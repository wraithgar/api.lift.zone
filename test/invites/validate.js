'use strict';

const Faker = require('faker');

const Server = require('../../server');
const Fixtures = require('../fixtures');

const db = Fixtures.db;

const lab = exports.lab = require('lab').script();
const expect = require('code').expect;

const before = lab.before;
const after = lab.after;
const describe = lab.describe;
const it = lab.it;

describe('GET /invites/{token}', () => {

  let server;
  const user = Fixtures.user();
  const invite = Fixtures.invite({ user_id: user.id });
  before(() => {

    return Promise.all([
      Server,
      db.users.insert(user)
    ]).then((items) => {

      server = items[0];
      return db.invites.insert(invite);
    });
  });

  after(() => {

    return db.users.destroy({ id: user.id });
  });

  it('valid invite', () => {

    return server.inject({ method: 'get', url: `/invites/${invite.token}` }).then((res) => {

      expect(res.statusCode).to.equal(204);
      return res.result;
    }).then((payload) => {

      expect(payload).to.not.exist();
    });
  });

  it('invalid invite', () => {

    const token = Faker.random.uuid();
    return server.inject({ method: 'get', url: `/invites/${token}` }).then((res) => {

      expect(res.statusCode).to.equal(404);
    });
  });
});
