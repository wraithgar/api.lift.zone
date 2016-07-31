'use strict';

const Bcrypt = require('bcrypt');
const Config = require('getconfig');

exports.seed = function (knex) {

  return knex('users').where('email', 'gar@danger.computer').del().then(() => {

    return knex('users').insert({
      name: 'Gar',
      email: 'gar@danger.computer',
      hash: Bcrypt.hashSync(Config.auth.seedPassword, Bcrypt.genSaltSync(10))
    });
  });
};
