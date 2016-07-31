'use strict';
const Boom = require('boom');

const DbHelper = function (db) {

    this.db = db;
    this.promise = db.bookshelf.knex.Primse;
};

module.exports = DbHelper;

DbHelper.prototype.rollbackAll = function () {

    const self = this;
    return self.db.knex.migrate.rollback().then(function (result) {

        if (result[0] > 0) {

            return self.rollbackAll();
        }
    });
};

DbHelper.prototype.migrateLatest = function () {

    return this.db.knex.migrate.latest();
};

DbHelper.prototype.createUser = function (attrs, invites) {

    invites = invites || { enabled: true, count: 0 };

    return this.db.User.createWithPassword(attrs, invites);
};

DbHelper.prototype.getUser = function (attrs) {

    return this.db.User.forge({ login: attrs.login }).fetch();
};
