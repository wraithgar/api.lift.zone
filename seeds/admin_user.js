'use strict';

const Bcrypt = require('bcrypt');
const Config = require('getconfig');

exports.seed = function (knex) {

  return knex('users').where('email', 'gar+liftzone@danger.computer').del().then(() => {

    return knex('users').insert({
      name: 'Gar',
      email: 'gar+liftzone@danger.computer',
      hash: Bcrypt.hashSync(Config.auth.seedPassword, Bcrypt.genSaltSync(10))
    }).returning('id').then((user) => {

      return Promise.all([
        knex('invites').insert({ user_id: user[0] }),
        knex('invites').insert({ user_id: user[0] }),
        knex('invites').insert({ user_id: user[0] }),
        knex('invites').insert({ user_id: user[0] }),
        knex('invites').insert({ user_id: user[0] }),
        knex('activities').insert({ user_id: user[0], name: 'Squat' }).returning('id').then((activity) => {

          return knex('activities').insert({ user_id: user[0], name: 'Barbell Squat', activity_id: activity[0] });
        }),
        knex('activities').insert({ user_id: user[0], name: 'Overhead Press' }).returning('id').then((activity) => {

          return knex('activities').insert({ user_id: user[0], name: 'OHP', activity_id: activity[0] });
        }),
        knex('activities').insert({ user_id: user[0], name: 'Front Squat' })
      ]);
    });
  });
};
