'use strict';
const Knex = require('knex');
const Bookshelf = require('bookshelf');

module.exports = function (config) {

    const db = Bookshelf(Knex({
        client: 'sqlite3',
        connection: {
            filename: config.db
        },
        pool: {
            afterCreate: function (conn, cb) {

                conn.run('PRAGMA foreign_keys = ON', cb);
            }
        }
    }));
    db.plugin('registry');
    db.plugin('visibility');

    const activity = require('./activity')(db, Knex.Promise);
    const activityName = require('./activity-name')(db, Knex.Promise);
    const invite = require('./invite')(db, Knex.Promise);
    const recovery = require('./recovery')(db, Knex.Promise);
    const set = require('./set')(db, Knex.Promise);
    const user = require('./user')(db, Knex.Promise);
    const validation = require('./validation')(db, Knex.Promise);
    const workout = require('./workout')(db, Knex.Promise);

    const results = {
        Promise: db.knex.Promise,
        bookshelf: db,
        knex: db.knex,

        Activity: activity.model, activities: activity.collection,
        ActivityName: activityName.model, ActivityNames: activityName.collection,
        Invite: invite.model, Invites: invite.collection,
        Recovery: recovery.model,
        Set: set.model, Sets: set.collection,
        User: user.model, Users: user.collection,
        Validation: validation.model,
        Workout: workout.model, Workouts: workout.collection
    };


    return results;
};
