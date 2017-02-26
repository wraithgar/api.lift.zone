'use strict';

const Fixtures = require('../fixtures');

const db = Fixtures.db;
const Server = Fixtures.server;

const lab = exports.lab = require('lab').script();
const expect = require('code').expect;

const before = lab.before;
const after = lab.after;
const describe = lab.describe;
const it = lab.it;

describe('DELETE /user', () => {

  let server;
  const keepUser = Fixtures.user();

  before(() => {

    return Promise.all([
      Server,
      db.users.insert(keepUser)
    ]).then((items) => {

      server = items[0];
    });
  });

  after(() => {

    return Promise.all([
      db.users.destroy({ id: keepUser.id })
    ]);
  });

  it('requires confirmation', () => {

    return server.inject({ method: 'delete', url: '/user', credentials: keepUser }).then((res) => {

      expect(res.statusCode).to.equal(400);
      return Fixtures.db.users.findOne({ id: keepUser.id });
    }).then((keptUser) => {

      expect(keptUser).to.exist();
    });
  });

  describe('deleting a user', () => {

    const user = Fixtures.user();

    before(() => {

      return db.users.insert(user);
    });

    after(() => {

      return db.users.destroy({ id: user.id });
    });

    it('deletes a user', () => {

      return server.inject({ method: 'delete', url: '/user?confirm=true', credentials: user }).then((res) => {

        expect(res.statusCode).to.equal(204);
        return Fixtures.db.users.findOne({ id: user.id });
      }).then((deletedUser) => {

        expect(deletedUser).to.not.exist();
        return Fixtures.db.users.findOne({ id: keepUser.id });
      }).then((keptUser) => {

        expect(keptUser).to.exist();
      });
    });
  });
});
