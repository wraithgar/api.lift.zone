var Boom = require('boom');
var baseModel = require('./base-model');
var utils = require('../utils');

module.exports = function (bookshelf, BPromise) {

    var BaseModel = baseModel(bookshelf);
    var Recovery = BaseModel.extend({
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
        reset: function (attrs) {

            return this.get({code: attrs.code}).then(function (recovery) {

                return bookshelf.transaction(function (t) {

                    return recovery.related('user').save({passwordHash: utils.passwordHash(attrs.password), supertoken: utils.generateSupertoken()}, {patch: true, transacting: t}).then(function (user) {

                        return recovery.destroy({transacting: t}).then(function () {

                            return {
                                id: user.get('id'),
                                type: 'authToken',
                                attributes: {
                                    token: utils.userToken(user)
                                }
                            };
                        });
                    });
                });
            });
        },
        get: function (attrs) {

            return new this(attrs).query('where', 'created', '>', bookshelf.knex.raw('datetime("now", "-1 days")')).fetch({withRelated: 'user'}).then(function (recovery) {

                if (!recovery) {
                    throw Boom.notFound();
                }
                return recovery;
            });
        }
    });

    bookshelf.model('Recovery', Recovery);

    return {
        model: Recovery
    };
};

