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

describe('GET /activities', () => {

  let server;
  const user1 = Fixtures.user();
  const user2 = Fixtures.user();
  const activity1 = Fixtures.activity({ user_id: user1.id });
  const activity2 = Fixtures.activity({ user_id: user1.id }, true);
  const activity3 = Fixtures.activity({ user_id: user1.id, activity_id: activity2.id });
  const activity4 = Fixtures.activity({ user_id: user2.id });

  before(() => {

    return Promise.all([
      Server,
      db.users.insert(user1),
      db.users.insert(user2)
    ]).then((items) => {

      server = items[0];
      return Promise.all([
        db.activities.insert(activity1),
        db.activities.insert(activity2),
        db.activities.insert(activity4)
      ]);
    }).then(() => {

      return db.activities.insert(activity3);
    });
  });

  after(() => {

    return Promise.all([
      db.users.destroy({ id: user1.id }),
      db.users.destroy({ id: user2.id })
    ]);
  });

  it('lists activities for a user', () => {

    return server.inject({ method: 'get', url: '/activities', credentials: user1 }).then((res) => {

      expect(res.statusCode).to.equal(200);
      expect(res.headers).to.include('link');
      return res.result;
    }).then((result) => {

      expect(result).to.not.part.include(activity1);
      expect(result).to.not.part.include(activity2);
      expect(result).to.part.include({ name: activity1.name, aliases: [] });
      expect(result).to.part.include({ id: activity2.id, aliases: [{ name: activity3.name }] });
      expect(result).to.not.part.include(activity3);
      expect(result).to.not.part.include(activity4);
    });
  });
});
