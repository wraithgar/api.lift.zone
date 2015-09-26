'use strict';
const Hoek = require('hoek');
const Boom = require('boom');
const Utils = require('../utils');
const _ = require('lodash');
const BaseModel = require('./base-model');
const BaseCollection = require('./base-collection');

module.exports = function User (bookshelf, BPromise) {

    const baseModel = BaseModel(bookshelf);
    const baseCollection = BaseCollection(bookshelf);

    const Model = baseModel.extend({
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
         * t.boolean('visible').notNullable().defaultTo(false);
         */
        //instance properties
        hidden: ['passwordHash', 'supertoken'],
        tableName: 'users',
        booleans: ['active', 'validated', 'smartmode', 'visible'],
        invites: function (skipValidation) {

            if (!skipValidation && !this.get('validated')) {
                throw Boom.notFound('Please validate first');
            }
            return this.hasMany('Invite');
        },
        validation: function () {

            return this.hasOne('Validation');
        },
        recovery: function () {

            return this.hasOne('Recovery');
        },
        activityNames: function () {

            return this.hasMany('ActivityName');
        },

        logout: function () {

            return this.save({ supertoken: Utils.generateSupertoken() }, { patch: true });
        },
        validate: BPromise.method(function () {

            const email = this.get('email');

            if (this.get('validated')) {
                return null;
            }

            return this.related('validation').make()
            .then(function (newValidation) {

                if (newValidation) {
                    return Utils.mailValidation(email, newValidation);
                }
            })
            .then(function () {

                return null;
            });
        }),
        confirm: BPromise.method(function (confirmation) {

            const self = this;

            if (self.get('validated')) {
                return null;
            }

            return self.related('validation').current()
            .then(function (validation) {

                if (!validation || (validation.get('code') !== confirmation.code)) {
                    throw Boom.notFound();
                }

                return bookshelf.transaction(function (t) {

                    return BPromise.all([
                        self.save({ validated: true }, { patch: true, transacting: t }),
                        validation.destroy({ transacting: t })
                    ]);
                });
            })
            .then(function () {

                return null;
            });
        }),
        update: function (attrs) {

            if (attrs.password) {
                const password = attrs.password;
                attrs.passwordHash = Utils.passwordHash(password);
                delete attrs.password;
            }
            if (attrs.email && attrs.email !== this.get('email')) {
                attrs.validated = false;
            }
            return this.save(attrs, { patch: true })
            .then(function (user) {

                //We have to do this to get a proper updatedAt formatting
                return user.fetch();
            });
        }
    }, {
        //class properties
        collection: function (models, options) {

            return Collection.forge((models || []), _.extend({}, options));
        },
        createWithPassword: function (attrs, invites, options) {

            attrs = Hoek.shallow(attrs);
            options = options || {};

            const password = attrs.password;
            delete attrs.password;

            attrs.passwordHash = Utils.passwordHash(password);
            attrs.supertoken = Utils.generateSupertoken();

            return Model.forge().save(attrs, options).tap(function (user) {

                const count = invites.count;
                const userInvites = new Array(count);
                for (let i = 0; i < count; i++) {
                    userInvites.push(user.invites(true).generate(options));
                }
                return BPromise.all(userInvites);
            });
        },
        loginWithPassword: function (attrs) {

            attrs = Hoek.shallow(attrs);

            const password = attrs.password;

            attrs = Hoek.clone(attrs);
            attrs.passwordHash = Utils.passwordHash(attrs.password);
            delete attrs.password;
            attrs.active = true;

            return new this(attrs).fetch({ require: true })
            .then(function (user) {

                return {
                    token: Utils.userToken(user)
                };
            }).catch(function (err) {

                throw Boom.notFound();
            });
        },
        signup: BPromise.method(function (invites, invite, attrs) {

            if (!invites.enabled) {
                throw Boom.forbidden('No signups');
            }

            const self = this;

            return bookshelf.model('Invite').get({ code: invite })
            .then(function (validInvite) {

                return self.forge({ login: attrs.login }).fetch()
                .then(function (existingLogin) {

                    if (existingLogin) {
                        throw Boom.conflict('login already taken');
                    }

                    return bookshelf.transaction(function (t) {

                        return BPromise.all([
                            self.createWithPassword(attrs, invites, { transacting: t }),
                            validInvite.destroy({ transacting: t })
                        ]);
                    })
                    .then(function () {

                        return self.loginWithPassword({ login: attrs.login, password: attrs.password });
                    });
                });
            });
        }),
        recover: function (attrs) {

            this.forge(attrs).fetch({ withRelated: 'recovery' })
            .then(function (user) {

                if (!user) {
                    return;
                }

                user.related('recovery').query('where', 'created', '>', bookshelf.knex.raw('datetime("now", "-1 days")')).fetch()
                .then(function (existingRecovery) {

                    if (!existingRecovery) {
                        user.related('recovery').save({ code: Utils.generateRecoveryCode() })
                        .then(function (recovery) {

                            Utils.mailRecovery(user.get('email'), user.get('login'), recovery);
                        });
                    }
                });
            });
        },
        taken: function (attrs) {

            const self = this;
            return bookshelf.model('Invite').get({ code: attrs.invite })
            .then(function (invite) {

                return self.forge({ login: attrs.login }).fetch()
                .then(function (existingLogin) {

                    const taken = !!existingLogin;

                    return {
                        taken: !!existingLogin
                    };
                });
            });
        }
    });

    const Collection = baseCollection.extend({
        model: Model
    });

    bookshelf.model('User', Model);
    bookshelf.collection('Users', Collection);

    return {
        model: Model,
        collection: Collection
    };
};
