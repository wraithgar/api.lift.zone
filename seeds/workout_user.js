'use strict';

const Bcrypt = require('bcrypt');
const Config = require('getconfig');
const Caber = require('caber');
const Entries = require('object.entries');

if (!Object.entries) {
  Entries.shim();
}


const activities = {
  'Squats': {
    aliases: ['Barbell Squat']
  },
  'Overhead Press': {
    aliases: ['OHP']
  },
  'Front Squat': {
    aliases: []
  }
};

const workouts = {
  'Friday Workout': {
    raw: `Friday Set List
Front Squat
Overhead Press 80x5x5
Barbell Squat 5x5`
  }
};

const removeActivityAliases = function (knex, activity_id) {

  return knex('activities').select('id').where('activity_id', activity_id).map((activity_alias) =>

    knex('activities').select().where('activity_id', activity_alias.id).del());
};

const removeActivity = function (knex, name) {

  return knex('activities').select('id').where('name', name).map((activityId) =>

    removeActivityAliases(knex, activityId.id).then(() =>

      knex('activities').where('id', activityId.id).del()
    )
  );
};

const addActivity = function (knex, user_id, name, details) {

  const data = {
    user_id: user_id,
    name: name,
    created_at: new Date(),
    updated_at: new Date()
  };
  return removeActivity(knex, name).then(() =>

    knex('activities').insert(data).returning('*').then((activity) => {

      return Promise.all(details.aliases.map((alias) => {

        return knex('activities').insert({
          user_id: user_id,
          activity_id: activity[0].id,
          name: alias,
          created_at: new Date(),
          updated_at: new Date()
        });
      }));
    }));
};

const addWorkout = function (knex, user_id, name, details) {

  const workout = Caber.workout(details.raw, 'lb');

  return Promise.all(workout.activities.map((item) =>

    knex('activities').where('name', item.name).then(([activityId]) => Object.assign(activityId, { sets: item.sets }) ))
  ).then((activity_list) => {

    const data = {
      name: name,
      user_id: user_id,
      activities: JSON.stringify(activity_list),
      raw: details.raw,
      raw_date: workout.rawDate,
      date: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    };
    return knex('workouts').insert(data);
  });
};



exports.seed = function (knex) {

  if (process.env.ALLOW_SEED === 'production' && process.env.ALLOW_SEED !== 'true') {
    console.log('not re-seeding admin in production');
    return;
  }

  return knex('users').where('email', 'test@lift.zone').del().then(() => {

    return knex('users').insert({
      name: 'Trophy',
      email: 'test@lift.zone',
      hash: Bcrypt.hashSync(Config.auth.seedPassword, Bcrypt.genSaltSync(10)),
      scope: JSON.stringify([]),
      created_at: new Date(),
      updated_at: new Date(),
      validated: true
    }).returning('id').then((user) => {

      const activity_promises = Promise.all(Object.entries(activities).map(([name, details]) =>

        addActivity(knex, user[0], name, details))
      ).then(() =>

        Promise.all(Object.entries(workouts).map(([name, details]) =>

          addWorkout(knex, user[0], name, details)
        ))
      );
      return Promise.all([
        ...[1,2,3,4,5].map((i) => knex('invites').insert({ user_id: user[0], created_at: new Date(), updated_at: new Date() })),
        activity_promises
      ]);
    });
  });
};
