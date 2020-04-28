'use strict'

exports.up = function (knex) {
  return knex.schema.createTable('validations', (validations) => {
    validations
      .uuid('token')
      .defaultTo(knex.raw('uuid_generate_v4()'))
      .primary()
    validations
      .uuid('user_id')
      .index()
      .notNullable()
      .references('users.id')
      .onDelete('CASCADE')
    validations.timestamps()
  })
}

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('validations')
}
