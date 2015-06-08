var Joi = require('joi');
var Hoek = require('hoek');
var Boom = require('boom');
var utils = require('../utils');
var baseModel = require('./base-model');
var baseCollection = require('./base-collection');

var scheme = {
    id: Joi.number().required(),
    login: Joi.string().required(),
    passwordHash: Joi.string().required(),
    name: Joi.string().required(),
    email: Joi.string().email().required()
};

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
        initialize: function () {

            this.on('saving', this.validateSave);
        },
        validateSave: function () {

            return Joi.validate(this.attributes, scheme);
        },
        logout: function () {

            return this.save({supertoken: utils.generateSupertoken()}, {patch: true});
        },
        invites: function () {

            return this.hasMany('Invite');
        },
        addInvite: function () {

            var code = utils.generateInviteCode();

            return this.related('invites').create({code: code}, {method: 'insert'});
        }
    }, {
        //class properties
        createWithPassword: function (attrs) {

            attrs = Hoek.shallow(attrs);

            return BPromise.resolve().then(function () {

                //TODO this should be validated in the controller?
                Joi.assert(attrs.password, Joi.string().min(8).required().example('hunter2!'));
            }).then(function () {

                var password = attrs.password;
                delete attrs.password;

                attrs.passwordHash = utils.passwordHash(password);
                attrs.supertoken = utils.generateSupertoken();
                return User.forge(attrs).save();
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
                    data: {
                        id: user.get('id'),
                        type: 'authToken',
                        attributes: {
                            token: utils.userToken(user)
                        }
                    }
                };
            }).catch(function (err) {

                throw Boom.notFound();
            });
        },
        signup: function (enabled, invite, attrs) {

            if (!enabled) {
                throw Boom.forbidden('No signups');
            }

            var self = this;
            var password = attrs.password;
            var loginAttrs = {
                email: attrs.email,
                password: password
            };

            attrs = Hoek.shallow(attrs);
            attrs.passwordHash = utils.passwordHash(password);
            attrs.supertoken = utils.generateSupertoken();
            delete attrs.password;
            attrs.active = true;

            return bookshelf.model('Invite').forge({code: invite}).fetch().then(function (invite) {

                if (!invite) {
                    throw Boom.notFound('Invalid invite');
                }

                return self.forge(attrs).save().then(function () {

                    return invite.destroy();
                });
            }).then(function () {

                return self.loginWithPassword(loginAttrs);
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
