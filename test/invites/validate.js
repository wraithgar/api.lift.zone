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
  const invite1 = Fixtures.invite({ user_id: user.id });
  const invite2 = Fixtures.invite({ user_id: user.id, claimed_by: user.id });
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

    return db.users.destroy({ id: user.id });
  });

  it('unclaimed invite', () => {

    return server.inject({ method: 'get', url: `/invites/${invite1.token}` }).then((res) => {

      expect(res.statusCode).to.equal(200);
      return res.result;
    }).then((payload) => {

      expect(invite1).to.include(payload);
    });
  });

  it('claimed invite', () => {

    return server.inject({ method: 'get', url: `/invites/${invite2.token}` }).then((res) => {

      expect(res.statusCode).to.equal(404);
    });
  });

  it('invalid invite', () => {

    const token = Faker.random.uuid();
    return server.inject({ method: 'get', url: `/invites/${token}` }).then((res) => {

      expect(res.statusCode).to.equal(404);
    });
  });
});
