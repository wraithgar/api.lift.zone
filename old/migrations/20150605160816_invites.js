
exports.up = function (knex) {

    return knex.schema.createTable('invites', function (t) {

        t.text('code').unique().index();
        t.integer('user_id').index().notNullable().references('users.id');
        t.timestamps();
    });
};

exports.down = function (knex) {

    return knex.schema.dropTableIfExists('invites');
};
