var Boom = require('boom');

var DbHelper = function (db) {

    this.db = db;
};

DbHelper.prototype.rollbackAll = function () {

    var self = this;
    return self.db.knex.migrate.rollback().then(function (result) {

        if (result[0] > 0) {

            return self.rollbackAll();
        }
    });
};

DbHelper.prototype.migrateLatest = function () {

    return this.db.knex.migrate.latest();
};

DbHelper.prototype.createUser = function (attrs) {

    return this.db.User.createWithPassword(attrs);
};

DbHelper.prototype.getUser = function (attrs) {

    return this.db.User.forge({login: attrs.login}).fetch();
};

DbHelper.prototype.createInvites = function (user, count) {

    var db = this.db;
    if (!count) {
        count = 1;
    }

    return this.getUser(user).then(function (foundUser) {

        if (!foundUser) {
            throw Boom.notFound('Could not find user to add invites', user);
        }

        var i;
        var invites = new Array(count);

        for (i = 0; i < count; i++) {
            invites.push(foundUser.addInvite());
        }

        return db.Promise.all(invites);
    });
};

module.exports = DbHelper;
