'use strict';
exports.up = function(knex, Promise) {

  return knex.table('users').select('id', 'preferences').then((users) => {

    return Promise.map(users, (user) => {

      user.preferences.weightUnit = 'lb';
      return knex.table('users').where({ id: user.id }).update({ preferences: user.preferences });
    });
  }).then(() => {

    return knex.raw(`ALTER TABLE ONLY users ALTER COLUMN preferences SET DEFAULT '${JSON.stringify({ weightUnit: 'lb', smartmode: true, visible: false, dateFormat: 'dddd, MMM Do YYYY' })}'`);
  });
};

exports.down = function(knex, Promise) {

  return knex.table('users').select('id', 'preferences').then((users) => {

    return Promise.map(users, (user) => {

      delete user.preferences.weightUnit;
      return knex.table('users').where({ id: user.id }).update({ preferences: user.preferences });
    });
  }).then(() => {

    return knex.raw(`ALTER TABLE ONLY users ALTER COLUMN preferences SET DEFAULT '${JSON.stringify({ smartmode: true, visible: false, dateFormat: 'dddd, MMM Do YYYY' })}'`);
  });
};
