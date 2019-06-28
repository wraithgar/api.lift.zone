'use strict';
exports.up = function(knex) {
  return knex
    .table('users')
    .select('id', 'preferences')
    .then(async users => {
      for (const user of users) {
        user.preferences.weightUnit = 'lb';
        await knex
          .table('users')
          .where({ id: user.id })
          .update({ preferences: user.preferences });
      }
    })
    .then(() => {
      return knex.raw(
        `ALTER TABLE ONLY users ALTER COLUMN preferences SET DEFAULT '${JSON.stringify(
          {
            weightUnit: 'lb',
            smartmode: true,
            visible: false,
            dateFormat: 'dddd, MMM Do YYYY'
          }
        )}'`
      );
    });
};

exports.down = function(knex) {
  return knex
    .table('users')
    .select('id', 'preferences')
    .then(async users => {
      for (const user of users) {
        delete user.preferences.weightUnit;
        await knex
          .table('users')
          .where({ id: user.id })
          .update({ preferences: user.preferences });
      }
    })
    .then(() => {
      return knex.raw(
        `ALTER TABLE ONLY users ALTER COLUMN preferences SET DEFAULT '${JSON.stringify(
          { smartmode: true, visible: false, dateFormat: 'dddd, MMM Do YYYY' }
        )}'`
      );
    });
};
