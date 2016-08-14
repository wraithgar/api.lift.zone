'use strict';

const Server = require('../../server');
const Fixtures = require('../fixtures');
const Faker = require('faker');
const Moment = require('moment');

const db = Fixtures.db;

const lab = exports.lab = require('lab').script();
const expect = require('code').expect;

const before = lab.before;
const after = lab.after;
const describe = lab.describe;
const it = lab.it;

describe('PUT /workouts', () => {

  let server;
  const user1 = Fixtures.user();
  const user2 = Fixtures.user();
  const workout1 = Fixtures.workout({ user_id: user1.id }, true);
  const workout2 = Fixtures.workout({ date: workout1.date, user_id: user2.id });
  const workout3 = Fixtures.workout({ id: workout1.id, date: workout1.date });
  const workout4 = Fixtures.workout({ user_id: user1.id }, true);
  const workout5 = Fixtures.workout({ date: workout4.date, id: workout4.id });

  before(() => {

    return Promise.all([
      Server,
      db.users.insert(user1),
      db.users.insert(user2)
    ]).then((items) => {

      server = items[0];
      return Promise.all([
        db.workouts.insert(workout1),
        db.workouts.insert(workout2),
        db.workouts.insert(workout4)
      ]);
    });
  });

  after(() => {

    return Promise.all([
      db.users.destroy({ id: user1.id }),
      db.users.destroy({ id: user2.id })
    ]);
  });

  it('updates a workout', () => {

    return server.inject({ method: 'put', url: `/workouts/${workout1.id}`, credentials: user1, payload: workout3 }).then((res) => {

      expect(res.statusCode).to.equal(200);
      return res.result;
    }).then((result) => {

      expect(result.id).to.equal(workout1.id);
      return db.workouts.findOne({ id: workout1.id });
    }).then((updatedWorkout) => {

      expect(updatedWorkout.raw).to.equal(workout3.raw);
    });

  });

  it('does not updated nonexistant workout', () => {

    return server.inject({ method: 'put', url: `/workouts/${Faker.random.uuid()}`, credentials: user1, payload: Fixtures.workout({}, true) }).then((res) => {

      expect(res.statusCode).to.equal(404);
    });
  });

  it('does not update over existing date', () => {

    return server.inject({ method: 'put', url: `/workouts/${workout1.id}`, credentials: user1, payload: workout5 }).then((res) => {

      expect(res.statusCode).to.equal(409);
    });
  });

  it('can update to a different date', () => {

    let date = new Date(workout1.date);
    date.setYear(date.getFullYear() - 1);
    date = Moment(date).format('YYYY-MM-DD');
    const workout = Fixtures.workout({ date }, true);
    return server.inject({ method: 'put', url: `/workouts/${workout1.id}`, credentials: user1, payload: workout }).then((res) => {

      expect(res.statusCode).to.equal(200);
    });
  });
});
