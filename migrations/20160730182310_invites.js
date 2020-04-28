'use strict'

exports.up = function (knex) {
  return knex.schema.createTable('invites', (invites) => {
    invites
      .uuid('token')
      .defaultTo(knex.raw('uuid_generate_v4()'))
      .primary()
    invites
      .uuid('user_id')
      .index()
      .notNullable()
      .references('users.id')
      .onDelete('CASCADE')
    invites
      .uuid('claimed_by')
      .references('users.id')
      .onDelete('CASCADE')
    invites.timestamps()
  })
}

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('invites')
}
