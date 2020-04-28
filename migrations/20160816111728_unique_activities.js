'use strict'

exports.up = function (knex) {
  return knex.raw(
    'CREATE UNIQUE INDEX "activities_user_id_name_idx_unique" ON activities (user_id, name)'
  )
}

exports.down = function (knex) {
  return knex.raw('DROP INDEX IF EXISTS "activities_user_id_name_idx_unique"')
}
