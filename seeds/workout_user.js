'use strict';

const Bcrypt = require('bcrypt');
const Config = require('getconfig');
const Caber = require('caber');

const activities = {
  Squats: {
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

const removeActivityAliases = async function(knex, activity_id) {
  const aliases = await knex('activities')
    .select('id')
    .where('activity_id', activity_id);

  for (const activity_alias of aliases) {
    await knex('activities')
      .select()
      .where('activity_id', activity_alias.id)
      .del();
  }
};

const removeActivity = async function(knex, name) {
  const ids = await knex('activities')
    .select('id')
    .where('name', name);

  for (const activityId of ids) {
    await removeActivityAliases(knex, activityId.id).then(() =>
      knex('activities')
        .where('id', activityId.id)
        .del()
    );
  }
};

const addActivity = async function(knex, user_id, name, details) {
  const data = {
    user_id,
    name,
    created_at: new Date(),
    updated_at: new Date()
  };
  await removeActivity(knex, name);
  const activity = await knex('activities')
    .insert(data)
    .returning('id');
  for (const alias of details.aliases) {
    await knex('activities').insert({
      user_id,
      activity_id: activity[0].id,
      name: alias,
      created_at: new Date(),
      updated_at: new Date()
    });
  }
};

const addWorkout = async function(knex, user_id, name, details) {
  const workout = Caber.workout(details.raw, 'lb');

  return Promise.all(
    workout.activities.map(item =>
      knex('activities')
        .where('name', item.name)
        .then(([activityId]) => Object.assign(activityId, { sets: item.sets }))
    )
  ).then(activity_list => {
    const data = {
      name,
      user_id,
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

exports.seed = async function(knex) {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.ALLOW_SEED !== 'true'
  ) {
    console.log('not re-seeding admin in production');
    return;
  }

  await knex('users')
    .where('email', 'test@lift.zone')
    .del();
  const user = await knex('users')
    .insert({
      name: 'Trophy',
      email: 'test@lift.zone',
      hash: Bcrypt.hashSync(Config.auth.seedPassword, Bcrypt.genSaltSync(10)),
      scope: JSON.stringify([]),
      created_at: new Date(),
      updated_at: new Date(),
      validated: true
    })
    .returning('id');
  for (const name in activities) {
    await addActivity(knex, user[0], name, activities[name]);
  }
  for (const name in workouts) {
    await addWorkout(knex, user[0], name, workouts[name]);
  }
  for (let i = 0; i < 5; i++) {
    await knex('invites').insert({
      user_id: user[0],
      created_at: new Date(),
      updated_at: new Date()
    });
  }
};
