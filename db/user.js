var Hoek = require('hoek');
var Boom = require('boom');
var Utils = require('../utils');
var _ = require('lodash');
var BaseModel = require('./base-model');
var BaseCollection = require('./base-collection');

module.exports = function (bookshelf, BPromise) {

    var baseModel = BaseModel(bookshelf);
    var baseCollection = BaseCollection(bookshelf);

    var User = baseModel.extend({
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
        type: 'user',
        tableName: 'users',
        hidden: ['passwordHash', 'supertoken'],
        booleans: ['active', 'validated', 'smartmode', 'visible'],
        invites: function () {

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
        addInvite: function (options) {

            var code = Utils.generateInviteCode();
            options = Hoek.applyToDefaults({ method: 'insert' }, options);

            return this.related('invites').create({ code: code }, options);
        },
        createValidation: function () {

            //Ughhhhhhh thanks for nothing knex
            return bookshelf.knex.raw('replace into validations (user_id, code, created_at, updated_at) values (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)', [this.get('id'), Utils.generateValidationCode()]);
        },
        getInvites: BPromise.method(function () {

            if (!this.get('validated')) {
                throw Boom.notFound('Please validate first');
            }
            return this.related('invites').fetch();
        }),
        sendValidation: function () {

            var email = this.get('email');
            return this.related('validation').fetch().then(function (validation) {

                return Utils.mailValidation(email, validation, BPromise);
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
                        self.save({ validated: true }, { patch: true, transacting: t }),
                        validation.destroy({ transacting: t })
                    ]);
                });
            }).then(function () {

                return null;
            });
        }),
        update: function (attrs) {

            attrs = _.pick(attrs, 'name', 'email', 'password', 'smartmode', 'visible');
            if (attrs.password) {
                var password = attrs.password;
                attrs.passwordHash = Utils.passwordHash(password);
                delete attrs.password;
            }
            if (attrs.email && attrs.email !== this.get('email')) {
                attrs.validated = false;
            }
            return this.save(attrs, { patch: true }).then(function (user) {

                //We have to do this to get a proper updatedAt formatting
                return user.fetch();
            });
        },
        getActivityName: function (attrs) {

            return this.related('activityNames').query({ where: attrs }).fetchOne({ withRelated: ['aliases'] }).then(function (activity) {

                if (!activity) {
                    throw Boom.notFound();
                }

                return activity;
            });
        },
        getActivityNames: function () {

            return this.related('activityNames').fetch({ withRelated: ['aliases'] });
        },
        searchActivityNames: function (attrs) {

            var names = attrs.name.toLowerCase().replace(/[^a-z\s]/, '').split(/\s+/).join(' OR ');

            return this.related('activityNames').query(function (qb) {

                this.join('activitynames', { 'activitynames.docid': 'useractivities.id' });
                this.andWhere(bookshelf.knex.raw('activitynames MATCH ?', names));
            }).fetch({ withRelated: ['aliases'] });
        },
        createActivity: function (attrs) {

            var self = this;

            return BPromise.resolve().then(function () {

                if (attrs.alias_id === undefined) {
                    return;
                }
                return self.related('activityNames').query({ where: { id: attrs.alias_id } }).fetchOne().then(function (alias) {

                    if (!alias) {
                        throw Boom.notFound('Alias not found');
                    }
                });
            }).then(function () {

                return self.related('activityNames').create(attrs);
            }).then(function (activityName) {

                return activityName.fetch({ withRelated: ['aliases'] });
            });
        }
    }, {
        //class properties
        createWithPassword: function (attrs, invites, options) {

            attrs = Hoek.shallow(attrs);
            options = options || {};

            var password = attrs.password;
            delete attrs.password;

            attrs.passwordHash = Utils.passwordHash(password);
            attrs.supertoken = Utils.generateSupertoken();

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
            attrs.passwordHash = Utils.passwordHash(attrs.password);
            delete attrs.password;
            attrs.active = true;

            return new this(attrs).fetch({ require: true }).then(function (user) {

                return {
                    id: user.get('id'),
                    type: 'authToken',
                    attributes: {
                        token: Utils.userToken(user)
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

            return bookshelf.model('Invite').get({ code: invite }).then(function (validInvite) {

                return self.forge({ login: attrs.login }).fetch().then(function (existingLogin) {

                    if (existingLogin) {
                        throw Boom.conflict('login already taken');
                    }

                    return bookshelf.transaction(function (t) {

                        return BPromise.all([
                            self.createWithPassword(attrs, invites, { transacting: t }),
                            validInvite.destroy({ transacting: t })
                        ]);
                    }).then(function () {

                        return self.loginWithPassword({ login: attrs.login, password: attrs.password });
                    });
                });
            });
        }),
        recover: function (attrs) {

            this.forge(attrs).fetch({ withRelated: 'recovery' }).then(function (user) {

                if (!user) {
                    return;
                }

                user.related('recovery').query('where', 'created', '>', bookshelf.knex.raw('datetime("now", "-1 days")')).fetch().then(function (existingRecovery) {

                    if (!existingRecovery) {
                        user.related('recovery').save({ code: Utils.generateRecoveryCode() }).then(function (recovery) {

                            Utils.mailRecovery(user.get('email'), recovery);
                        });
                    }
                });
            });
        },
        taken: function (attrs) {

            var self = this;
            return bookshelf.model('Invite').get({ code: attrs.invite }).then(function (invite) {

                return self.forge({ login: attrs.login }).fetch().then(function (existingLogin) {

                    var taken = !!existingLogin;

                    return {
                        id: 'taken',
                        type: 'taken',
                        attributes: {
                            taken: !!existingLogin
                        }
                    };
                });
            });
        }
    });

    var Users = baseCollection.extend({
        model: User
    });

    bookshelf.model('User', User);
    bookshelf.collection('Users', Users);

    return {
        model: User,
        collection: Users
    };
};
