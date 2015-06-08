
exports.up = function (knex) {

    return knex.schema.createTable('sets', function (t) {

        t.increments('id').primary();
        t.integer('activity_id').index().notNullable().references('activities.id');
        t.boolean('pr').notNullable().defaultTo(false);
        t.integer('reps');
        t.integer('weight');
        t.text('unit');
        t.integer('distance');
        t.integer('time');
    });
};

exports.down = function (knex) {

    return knex.schema.dropTableIfExists('sets');
};
