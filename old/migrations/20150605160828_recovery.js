
exports.up = function (knex) {

    return knex.schema.createTable('recoveries', function (t) {

        t.integer('user_id').index().notNullable().references('users.id');
        t.text('code').notNullable();
        t.timestamps();
    });
};

exports.down = function (knex) {

    return knex.schema.dropTableIfExists('recoveries');
};
