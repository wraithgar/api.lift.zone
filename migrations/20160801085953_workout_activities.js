'use strict';
exports.up = function(knex, Promise) {

  return knex.schema.createTable('workout_activities', (workout_activities) => {

    workout_activities.uuid('id').defaultTo(knex.raw('uuid_generate_v4()')).primary();
    workout_activities.uuid('workout_id').index().notNullable().references('workouts.id').onDelete('CASCADE');
    workout_activities.uuid('activity_id').index().notNullable().references('activities.id').onDelete('CASCADE');
    workout_activities.text('comment');
    workout_activities.timestamps();
  });
};

exports.down = function(knex, Promise) {

  return knex.schema.dropTableIfExists('workout_activities');
};
