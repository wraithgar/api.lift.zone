'use strict'

exports.up = function (knex) {
  return Promise.all([
    knex.raw('DROP INDEX IF EXISTS "users_email_index"'),
    knex.raw(
      'CREATE UNIQUE INDEX users_email_lower_unique on users ((lower(email)))'
    )
  ])
}

exports.down = function (knex) {
  return Promise.all([
    knex.raw('DROP INDEX IF EXISTS "users_email_lower_unique"'),
    knex.raw('CREATE INDEX "users_email_index" ON users (email)')
  ])
}
