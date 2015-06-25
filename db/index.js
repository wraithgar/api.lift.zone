var knex = require('knex');
var bookshelf = require('bookshelf');

module.exports = function (config) {

    var db = bookshelf(knex({
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

    var user = require('./user')(db, knex.Promise);
    var invite = require('./invite')(db, knex.Promise);
    var recovery = require('./recovery')(db, knex.Promise);
    var validation = require('./validation')(db, knex.Promise);

    var results = {
        Promise: db.knex.Promise,
        bookshelf: db,
        knex: db.knex,

        Invite: invite.model, Invites: invite.collection,
        Recovery: recovery.model,
        User: user.model, Users: user.collection,
        Validation: validation.model
    };


    return results;
};
