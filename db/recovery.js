'use strict';
const Boom = require('boom');
const BaseModel = require('./base-model');
const Utils = require('../utils');
const _ = require('lodash');

module.exports = function Recovery (bookshelf, BPromise) {

    const baseModel = BaseModel(bookshelf);
    const Model = baseModel.extend({
        /*
         * t.integer('user_id').index().notNullable().references('users.id');
         * t.text('code').notNullable().index();
         */
        type: 'recovery',
        idAttribute: 'code',
        tableName: 'recoveries',
        user: function () {

            return this.belongsTo('User');
        }
    }, {
        collection: function (models, options) {

            return Collection.forge((models || []), _.extend({}, options));
        },
        reset: function (attrs) {

            return this.get({ code: attrs.code }).then(function (recovery) {

                return bookshelf.transaction(function (t) {

                    return recovery.related('user').save({ passwordHash: Utils.passwordHash(attrs.password), supertoken: Utils.generateSupertoken() }, { patch: true, transacting: t }).then(function (user) {

                        return recovery.destroy({ transacting: t }).then(function () {

                            return {
                                id: user.get('id'),
                                type: 'authToken',
                                attributes: {
                                    token: Utils.userToken(user)
                                }
                            };
                        });
                    });
                });
            });
        },
        get: function (attrs) {

            return new this(attrs).query('where', 'created', '>', bookshelf.knex.raw('datetime("now", "-1 days")')).fetch({ withRelated: 'user' }).then(function (recovery) {

                if (!recovery) {
                    throw Boom.notFound();
                }
                return recovery;
            });
        }
    });

    bookshelf.model('Recovery', Model);

    return {
        model: Model
    };
};

