'use strict';

exports.up = function(knex, Promise) {

  return knex.schema.table('workouts', (table) => {

    table.text('raw_date');
  });
};

exports.down = function(knex, Promise) {

  return knex.schema.table('workouts', (table) => {

    table.dropColumn('raw_date');
  });
};
