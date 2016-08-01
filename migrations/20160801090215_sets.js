'use strict';

exports.up = function(knex, Promise) {

  return knex.schema.createTable('sets', (sets) => {

    sets.uuid('id').defaultTo(knex.raw('uuid_generate_v4()')).primary();
    sets.uuid('workout_activity_id').index().notNullable().references('workout_activities.id').onDelete('CASCADE');
    sets.boolean('pr').notNullable().defaultTo(false);
    sets.integer('reps');
    sets.integer('weight');
    sets.text('unit');
    sets.integer('distance');
    sets.integer('time');
    sets.timestamps();
  });
};

exports.down = function(knex, Promise) {

  return knex.schema.dropTableIfExists('sets');
};
