'use strict';

exports.up = function (knex) {

  return knex.schema.createTable('workouts', (workouts) => {

    workouts.uuid('id').defaultTo(knex.raw('uuid_generate_v4()')).primary();
    workouts.uuid('user_id').index().notNullable().references('users.id').onDelete('CASCADE');
    workouts.text('name').notNullable();
    workouts.text('raw').notNullable();
    workouts.date('date').index().notNullable();
    workouts.timestamps();
  });
};

exports.down = function (knex) {

  return knex.schema.dropTableIfExists('workouts');
};
