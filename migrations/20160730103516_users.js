'use strict';

exports.up = function(knex) {
  return knex.schema.createTable('users', users => {
    users
      .uuid('id')
      .defaultTo(knex.raw('uuid_generate_v4()'))
      .primary();
    users.text('name').notNullable();
    users
      .text('email')
      .notNullable()
      .unique()
      .index();
    users.text('hash').notNullable();
    users
      .timestamp('logout')
      .notNullable()
      .defaultTo(knex.raw('now()'));
    users
      .boolean('active')
      .notNullable()
      .defaultTo(true);
    users
      .boolean('validated')
      .notNullable()
      .defaultTo(false);
    users
      .jsonb('preferences')
      .notNullable()
      .defaultTo(
        JSON.stringify({
          smartmode: true,
          visible: false,
          dateFormat: 'dddd, MMM Do YYYY'
        })
      );
    users
      .jsonb('scope')
      .notNullable()
      .defaultTo(JSON.stringify(['public']));
    users.timestamps();
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('users');
};
