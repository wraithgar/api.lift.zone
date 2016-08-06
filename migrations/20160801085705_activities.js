'use strict';

exports.up = function(knex) {

  return knex.schema.createTable('activities', (activities) => {

    activities.uuid('id').defaultTo(knex.raw('uuid_generate_v4()')).primary();
    activities.uuid('user_id').index().notNullable().references('users.id').onDelete('CASCADE');
    activities.uuid('activity_id').index().references('activities.id').onDelete('CASCADE');
    activities.text('name').notNullable();
    activities.timestamps();
  }).then(() => {

    return knex.raw('CREATE INDEX name_idx ON activities USING GIN (to_tsvector(\'english\', name))');
  });
};

exports.down = function(knex) {

  return knex.schema.dropTableIfExists('activities');
};
