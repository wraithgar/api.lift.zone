
exports.up = function (knex) {

    return knex.schema.createTable('useractivities', function (t) {

        t.increments('id').primary();
        t.integer('user_id').index().notNullable().references('users.id');
        t.integer('useractivity_id').index().references('useractivities.id');
        t.text('name').notNullable().index();
        t.timestamps();
        t.unique(['user_id', 'name']);
    });
};

exports.down = function (knex) {

    return knex.schema.dropTableIfExists('useractivities');
};
