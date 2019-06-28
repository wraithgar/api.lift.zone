'use strict';

exports.up = function(knex) {
  return knex.schema.createTable('recoveries', recoveries => {
    recoveries
      .uuid('token')
      .defaultTo(knex.raw('uuid_generate_v4()'))
      .primary();
    recoveries
      .text('email')
      .index()
      .notNullable()
      .references('users.email')
      .onDelete('CASCADE');
    recoveries.timestamps();
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('recoveries');
};
