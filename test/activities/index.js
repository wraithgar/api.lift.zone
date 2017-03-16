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
  const activity5 = Fixtures.activity({ user_id: user1.id });
  const activity6 = Fixtures.activity({ user_id: user1.id });
  const activity7 = Fixtures.activity({ user_id: user1.id });
  const activity8 = Fixtures.activity({ user_id: user1.id });
  const activity9 = Fixtures.activity({ user_id: user1.id });
  const activity10 = Fixtures.activity({ user_id: user1.id });
  const activity11 = Fixtures.activity({ user_id: user1.id });
  const activity12 = Fixtures.activity({ user_id: user1.id });
  const activity13 = Fixtures.activity({ user_id: user1.id });

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
        db.activities.insert(activity4),
        db.activities.insert(activity5),
        db.activities.insert(activity6),
        db.activities.insert(activity7),
        db.activities.insert(activity8),
        db.activities.insert(activity9),
        db.activities.insert(activity10),
        db.activities.insert(activity11),
        db.activities.insert(activity12),
        db.activities.insert(activity13)
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

      expect(res.statusCode).to.equal(206);
      expect(res.headers).to.include('link');
      expect(res.headers['content-range']).to.equal('0-9/11');
      return res.result;
    }).then((result) => {

      expect(result).to.have.length(10);
    });
  });

  it('lists all activities for a user', () => {

    return server.inject({ method: 'get', url: '/activities?limit=20', credentials: user1 }).then((res) => {

      expect(res.statusCode).to.equal(200);
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
