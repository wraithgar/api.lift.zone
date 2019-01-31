'use strict';

const Fixtures = require('../../fixtures');

const db = Fixtures.db;
const Server = Fixtures.server;

const lab = exports.lab = require('lab').script();
const expect = require('code').expect;

const before = lab.before;
const after = lab.after;
const describe = lab.describe;
const it = lab.it;

describe('GET /admin/users', () => {

  let server;
  const admin = Fixtures.user({ scope: ['admin'] });
  const user = Fixtures.user();
  const activity = Fixtures.activity({ user_id: user.id });
  const workout = Fixtures.workout({ user_id: user.id });

  before(() => {


    return Promise.all([
      Server,
      db.users.insert(admin),
      db.users.insert(user)
    ]).then((items) => {

      server = items[0];
      return Promise.all([
        db.activities.insert(activity),
        db.workouts.insert(workout)
      ]);
    });
  });

  after(() => {

    return Promise.all([
      db.users.destroy({ id: admin.id }),
      db.users.destroy({ id: user.id })
    ]);
  });

  it('lists users', () => {

    return server.inject({ method: 'get', url: '/admin/users', auth: { strategy: 'jwt', credentials: admin } }).then((res) => {

      expect(res.statusCode).to.equal(200);
      return res.result;
    }).then((result) => {

      expect(result).to.once.part.include({ id: user.id, workouts: 1, activities: 1 });
      expect(result).to.once.part.include({ id: admin.id, workouts: 0, activities: 0 });
    });
  });

  it('requires admin', () => {

    return server.inject({ method: 'get', url: '/admin/users', auth: { strategy: 'jwt', credentials: user } }).then((res) => {

      expect(res.statusCode).to.equal(403);
    });
  });
});
