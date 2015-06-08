var Joi = require('joi');

var controllers = {};

controllers.login = {
    description: 'Log in',
    tags: ['user'],
    handler: function (request, reply) {

        var db = this.db;
        var data = request.payload.data;

        request.server.log(['users', 'auth'], 'Login: ' + data.attributes.email);

        return reply(db.User.loginWithPassword(data.attributes)).code(201);
    },
    validate: {
        payload: {
            data: Joi.object().keys({
                type: Joi.string().valid('login'),
                attributes: Joi.object().keys({
                    email: Joi.string().email().required().example('user@lift.zone'),
                    password: Joi.string().min(8).required().example('hunter2!')
                })
            })
        }
    },
    auth: false
};

controllers.logout = {
    description: 'Log out',
    tags: ['user'],
    handler: function (request, reply) {

        var db = this.db;

        request.server.log(['users', 'auth'], 'Logout: ' + request.auth.credentials.user.get('email'));

        return reply(request.auth.credentials.user.logout().then(function () {

            return request.generateResponse().code(204);
        }));
    }
};

controllers.me = {
    description: 'Currently logged in user',
    tags: ['user'],
    handler: function (request, reply) {

        return reply({data: request.auth.credentials.user});
    }
};

controllers.invites = {
    description: 'Invites for currently logged in user',
    tags: ['user'],
    handler: function (request, reply) {

        var db = this.db;

        return reply({data: request.auth.credentials.user.related('invites')});
    }
};

controllers.signup = {
    description: 'Sign up',
    tags: ['user'],
    handler: function (request, reply) {

        var db = this.db;
        var data = request.payload.data;

        var attrs = {
            login: data.attributes.login,
            name: data.attributes.name,
            email: data.attributes.email,
            password: data.attributes.password
        };

        return reply(db.User.signup(this.config.invites, data.attributes.invite, attrs)).code(201);
    },
    validate: {
        payload: {
            data: Joi.object().keys({
                type: Joi.string().valid('invite'),
                attributes: Joi.object().keys({
                    invite: Joi.string().guid().required(),
                    login: Joi.string().required(),
                    name: Joi.string().required(),
                    password: Joi.string().min(8, 'utf-8').required(),
                    passwordConfirm: Joi.ref('password'),
                    email: Joi.string().email().required()
                })
            })
        }
    },
    auth: false
};

module.exports = controllers;
