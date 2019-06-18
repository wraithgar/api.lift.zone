'use strict';

const Faker = require('faker');

const Fixtures = require('../fixtures');

const { db, Server, expect } = Fixtures;

const lab = exports.lab = require('@hapi/lab').script();

const { before, after, describe, it } = lab;

describe('GET /activities/{id}/history', () => {

  let server;
  const user = Fixtures.user();
  const activity1 = Fixtures.activity({ user_id: user.id, sets: [{ reps: 4 }] }, true);
  const activity2 = Fixtures.activity({ user_id: user.id, activity_id: activity1.id, sets: [{ reps: 5 }] }, true);
  const activity3 = Fixtures.activity({ user_id: user.id }, true);
  const activity4 = Fixtures.activity({ user_id: user.id }, true);
  const workout1 = Fixtures.workout({ user_id: user.id, activities: [activity1] }, true);
  const workout2 = Fixtures.workout({ user_id: user.id, activities: [activity2] }, true);
  const workout3 = Fixtures.workout({ user_id: user.id, activities: [activity3] }, true);

  before(async () => {

    server = await Server;
    await db.users.insert(user);
    await db.activities.insert(activity1);
    await Promise.all([
      db.activities.insert(activity2),
      db.activities.insert(activity3),
      db.activities.insert(activity4)
    ]);
    await Promise.all([
      db.workouts.insert(workout1),
      db.workouts.insert(workout2),
      db.workouts.insert(workout3)
    ]);
  });

  after(async () => {

    await db.users.destroy({ id: user.id });
  });

  it('gets history for an activity', async () => {

    const res = await server.inject({ method: 'get', url: `/activities/${activity1.id}/history`, auth: { credentials: user, strategy: 'jwt' } });

    expect(res.statusCode).to.equal(200);
    expect(res.result).to.part.include([{ workout_name: workout1.name, sets: [{ reps: 4 }] }]);
    expect(res.result).to.part.include([{ workout_name: workout2.name, sets: [{ reps: 5 }] }]);
    expect(res.result).to.not.part.include([{ workout_name: workout3.name }]);
  });

  it('does not find nonexistant activity', () => {

    return server.inject({ method: 'get', url: `/activities/${Faker.random.uuid()}/history`, auth: { credentials: user, strategy: 'jwt' } }).then((res) => {

      expect(res.statusCode).to.equal(404);
    });
  });

  it('gets history for a now aliased activity', () => {

    return server.inject({ method: 'get', url: `/activities/${activity2.id}/history?page=1`, auth: { credentials: user, strategy: 'jwt' } }).then((res) => {

      expect(res.statusCode).to.equal(200);
      return res.result;
    }).then((result) => {

      expect(result).to.part.include([{ workout_name: workout1.name, sets: [{ reps: 4 }] }]);
      expect(result).to.part.include([{ workout_name: workout2.name, sets: [{ reps: 5 }] }]);
      expect(result).to.not.part.include([{ workout_name: workout3.name }]);
    });
  });

  it('gets history for an activity with no workouts', () => {

    return server.inject({ method: 'get', url: `/activities/${activity4.id}/history`, auth: { credentials: user, strategy: 'jwt' } }).then((res) => {

      expect(res.statusCode).to.equal(200);
      return res.result;
    }).then((result) => {

      expect(result).to.equal([]);
    });
  });
});
