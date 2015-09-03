var Knex = require('knex');
var Bookshelf = require('bookshelf');

module.exports = function (config) {

    var db = Bookshelf(Knex({
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

    var activityName = require('./activity-name')(db, Knex.Promise);
    var invite = require('./invite')(db, Knex.Promise);
    var recovery = require('./recovery')(db, Knex.Promise);
    var user = require('./user')(db, Knex.Promise);
    var validation = require('./validation')(db, Knex.Promise);

    var results = {
        Promise: db.knex.Promise,
        bookshelf: db,
        knex: db.knex,

        ActivityName: activityName.model, ActivityNames: activityName.collection,
        Invite: invite.model, Invites: invite.collection,
        Recovery: recovery.model,
        User: user.model, Users: user.collection,
        Validation: validation.model
    };


    return results;
};
