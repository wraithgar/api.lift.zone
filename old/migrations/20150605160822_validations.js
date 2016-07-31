
exports.up = function (knex) {

    return knex.schema.createTable('validations', function (t) {

        t.integer('user_id').primary().notNullable().references('users.id');
        t.text('code').notNullable().index();
        t.timestamps();
    });
};

exports.down = function (knex) {

    return knex.schema.dropTableIfExists('validations');
};
