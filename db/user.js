var Hoek = require('hoek');
var Boom = require('boom');
var utils = require('../utils');
var baseModel = require('./base-model');
var baseCollection = require('./base-collection');

module.exports = function (bookshelf, BPromise) {

    var BaseModel = baseModel(bookshelf);
    var BaseCollection = baseCollection(bookshelf);

    var User = BaseModel.extend({
        /*
         *
         * t.increments('id').primary();
         * t.boolean('active').notNullable().defaultTo(false);
         * t.text('login').notNullable().unique().index();
         * t.text('password_hash').notNullable();
         * t.text('supertoken').notNullable();
         * t.text('name').notNullable();
         * t.text('email').notNullable().index();
         * t.boolean('validated').notNullable().defaultTo(false);
         * t.boolean('smartmode').notNullable().defaultTo(true);
         * t.boolean('public').notNullable().defaultTo(false);
         */
        //instance properties
        type: 'user',
        tableName: 'users',
        hidden: ['passwordHash', 'supertoken'],
        booleans: ['active', 'validated', 'smartmode', 'public'],
        invites: function () {

            return this.hasMany('Invite');
        },
        validation: function () {

            return this.hasOne('Validation');
        },
        recovery: function () {

            return this.hasOne('Recovery');
        },
        logout: function () {

            return this.save({supertoken: utils.generateSupertoken()}, {patch: true});
        },
        addInvite: function (options) {

            var code = utils.generateInviteCode();
            options = Hoek.applyToDefaults({method: 'insert'}, options);

            return this.related('invites').create({code: code}, options);
        },
        createValidation: function () {

            //Ughhhhhhh thanks for nothing knex
            return bookshelf.knex.raw('replace into validations (user_id, code, created_at, updated_at) values (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)', [this.get('id'), utils.generateValidationCode()]);
        },
        getInvites: BPromise.method(function () {

            if (!this.get('validated')) {
                throw Boom.notFound('Please validate first');
            }
            return this.related('invites');
        }),
        sendValidation: function () {

            var email = this.get('email');
            return this.related('validation').fetch().then(function (validation) {

                return utils.mailValidation(email, validation, BPromise);
            });
        },
        validate: BPromise.method(function () {

            var self = this;

            if (self.get('validated')) {
                return null;
            }

            return self.related('validation').recent().then(function (validation) {

                if (validation) {
                    return null;
                }

                //Create new validation and send email
                return self.createValidation().then(function () {

                    return self.sendValidation();
                }).then(function () {

                    return null;
                });

            });
        }),
        confirm: BPromise.method(function (confirmation) {

            var self = this;

            if (self.get('validated')) {
                return null;
            }

            return self.related('validation').current().then(function (validation) {

                if (!validation || (validation.get('code') !== confirmation.id)) {
                    throw Boom.notFound();
                }

                return bookshelf.transaction(function (t) {

                    return BPromise.all([
                        self.save({validated: true}, {patch: true, transacting: t}),
                        validation.destroy({transacting: t})
                    ]);
                });
            }).then(function () {

                return null;
            });
        })
    }, {
        //class properties
        createWithPassword: function (attrs, invites, options) {

            attrs = Hoek.shallow(attrs);
            options = options || {};

            var password = attrs.password;
            delete attrs.password;

            attrs.passwordHash = utils.passwordHash(password);
            attrs.supertoken = utils.generateSupertoken();

            return User.forge().save(attrs, options).tap(function (user) {

                var count = invites.count;
                var userInvites = new Array(count);
                var i = 0;
                for (;i < count; i++) {
                    userInvites.push(user.addInvite(options));
                }
                return BPromise.all(userInvites);
            });
        },
        loginWithPassword: function (attrs) {

            attrs = Hoek.shallow(attrs);

            var password = attrs.password;

            attrs = Hoek.clone(attrs);
            attrs.passwordHash = utils.passwordHash(attrs.password);
            delete attrs.password;
            attrs.active = true;

            return new this(attrs).fetch({require: true}).then(function (user) {

                return {
                    id: user.get('id'),
                    type: 'authToken',
                    attributes: {
                        token: utils.userToken(user)
                    }
                };
            }).catch(function (err) {

                throw Boom.notFound();
            });
        },
        signup: BPromise.method(function (invites, invite, attrs) {

            if (!invites.enabled) {
                throw Boom.forbidden('No signups');
            }

            var self = this;
            return bookshelf.model('Invite').get({code: invite}).then(function (invite) {

                return bookshelf.transaction(function (t) {

                    return BPromise.all([
                        self.createWithPassword(attrs, invites, {transacting: t}),
                        invite.destroy({transacting: t})
                    ]);
                }).then(function () {

                    return self.loginWithPassword({email: attrs.email, password: attrs.password});
                });
            });
        }),
        recover: function (attrs) {

            this.forge(attrs).fetch({withRelated: 'recovery'}).then(function (user) {

                if (!user) {
                    return;
                }

                user.related('recovery').query('where', 'created', '>', bookshelf.knex.raw('datetime("now", "-1 days")')).fetch().then(function (existingRecovery) {

                    if (!existingRecovery) {
                        user.related('recovery').save({code: utils.generateRecoveryCode()}).then(function (recovery) {

                            utils.mailRecovery(user.get('email'), recovery);
                        });
                    }
                });
            });
        }
    });

    var Users = BaseCollection.extend({
        model: User
    });

    bookshelf.model('User', User);
    bookshelf.collection('Users', Users);

    return {
        model: User,
        collection: Users
    };
};
