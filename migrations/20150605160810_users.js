
exports.up = function (knex) {

    return knex.schema.createTable('users', function (t) {

        t.increments('id').primary();
        t.boolean('active').notNullable().defaultTo(false);
        t.text('login').notNullable().unique().index();
        t.text('password_hash').notNullable();
        t.text('supertoken').notNullable();
        t.text('name').notNullable();
        t.text('email').notNullable().index();
        t.boolean('validated').notNullable().defaultTo(false);
        t.boolean('smartmode').notNullable().defaultTo(true);
        t.boolean('public').notNullable().defaultTo(false);
        t.timestamps();
    });
};

exports.down = function (knex) {

    return knex.schema.dropTableIfExists('users');
};
