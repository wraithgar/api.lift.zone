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

describe('GET /user/invites', () => {

  let server;
  const user1 = Fixtures.user();
  const user2 = Fixtures.user({ validated: false });
  const invite1 = Fixtures.invite({ user_id: user1.id });
  const invite2 = Fixtures.invite({ user_id: user2.id });
  const invite3 = Fixtures.invite({ user_id: user1.id, claimed_by: user1.id });
  before(() => {

    return Promise.all([
      Server,
      db.users.insert(user1),
      db.users.insert(user2)
    ]).then((items) => {

      server = items[0];
      return Promise.all([
        db.invites.insert(invite1),
        db.invites.insert(invite2),
        db.invites.insert(invite3)
      ]);
    });
  });

  after(() => {

    return Promise.all([
      db.users.destroy({ id: user1.id }),
      db.users.destroy({ id: user2.id })
    ]);
  });

  it('lists invites', () => {

    return server.inject({ method: 'get', url: '/user/invites', credentials: user1 }).then((res) => {

      expect(res.statusCode).to.equal(200);
      return res.result;
    }).then((payload) => {

      expect(payload).to.include({ token: invite1.token });
    });
  });

  it('lists no invites if user not validated', () => {

    return server.inject({ method: 'get', url: '/user/invites', credentials: user2 }).then((res) => {

      expect(res.statusCode).to.equal(200);
      return res.result;
    }).then((payload) => {

      expect(payload).to.be.empty();
    });
  });
});
