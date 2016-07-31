
exports.up = function (knex) {

    return knex.schema.createTable('activities', function (t) {

        t.increments('id').primary();
        t.integer('workout_id').index().notNullable().references('workouts.id');
        t.integer('useractivity_id').index().notNullable().references('useractivities.id');
        t.text('comment');
        t.timestamps();
        t.unique(['workout_id', 'useractivity_id']);
    });
};

exports.down = function (knex) {

    return knex.schema.dropTableIfExists('activities');
};
