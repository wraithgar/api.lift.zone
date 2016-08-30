'use strict';

exports.up = function(knex, Promise) {

  return Promise.all([
    knex.raw('DROP INDEX IF EXISTS "users_email_index"'),
    knex.raw('CREATE INDEX "users_email_lowercase_index" ON users ((lower(email)))')
  ]);
};

exports.down = function(knex) {

  return Promise.all([
    knex.raw('DROP INDEX IF EXISTS "users_email_lowercase_index"'),
    knex.raw('CREATE INDEX "users_email_index" ON users (email)')
  ]);
};
