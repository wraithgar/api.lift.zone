
exports.up = function (knex) {

    return knex.schema.createTable('workouts', function (t) {

        t.increments('id').primary();
        t.integer('user_id').index().notNullable().references('users.id');
        t.text('name').notNullable();
        t.text('raw').notNullable();
        t.date('date').notNullable();
        t.timestamps();
    });
};

exports.down = function (knex) {

    return knex.schema.dropTableIfExists('workouts');
};
