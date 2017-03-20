'use strict';

const Bcrypt = require('bcrypt');
const Config = require('getconfig');

exports.seed = function (knex) {

  if (process.env.ALLOW_SEED === 'production' && process.env.ALLOW_SEED !== 'true') {
    console.log('not re-seeding admin in production');
    return;
  }

  return knex('users').where('email', 'admin@lift.zone').del().then(() => {

    return knex('users').insert({
      name: 'Admin',
      email: 'admin@lift.zone',
      hash: Bcrypt.hashSync(Config.auth.seedPassword, Bcrypt.genSaltSync(10)),
      scope: JSON.stringify(['admin']),
      created_at: new Date(),
      updated_at: new Date()
    }).returning('id').then((user) => {

      return Promise.all([
        knex('invites').insert({ user_id: user[0], created_at: new Date(), updated_at: new Date() }),
        knex('invites').insert({ user_id: user[0], created_at: new Date(), updated_at: new Date() }),
        knex('invites').insert({ user_id: user[0], created_at: new Date(), updated_at: new Date() }),
        knex('invites').insert({ user_id: user[0], created_at: new Date(), updated_at: new Date() }),
        knex('invites').insert({ user_id: user[0], created_at: new Date(), updated_at: new Date() }),
        knex('activities').insert({ user_id: user[0], name: 'Squat', created_at: new Date(), updated_at: new Date() }).returning('id').then((activity) => {

          return knex('activities').insert({ user_id: user[0], name: 'Barbell Squat', activity_id: activity[0], created_at: new Date(), updated_at: new Date() });
        }),
        knex('activities').insert({ user_id: user[0], name: 'Overhead Press', created_at: new Date(), updated_at: new Date() }).returning('id').then((activity) => {

          return knex('activities').insert({ user_id: user[0], name: 'OHP', activity_id: activity[0], created_at: new Date(), updated_at: new Date() });
        }),
        knex('activities').insert({ user_id: user[0], name: 'Front Squat', created_at: new Date(), updated_at: new Date() })
      ]);
    });
  });
};
