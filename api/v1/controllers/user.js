'use strict';
const Joi = require('joi');
const Hoek = require('hoek');
const _ = require('lodash');

const controllers = {};

module.exports = controllers;

controllers.login = {
    description: 'Log in',
    tags: ['user'],
    handler: function (request, reply) {

        const db = this.db;

        request.server.log(['users', 'auth'], 'Login: ' + request.payload.login);

        return reply(db.User.loginWithPassword(request.payload).then(function (user) {

            return { data: user };
        })).code(201);
    },
    validate: {
        payload: {
            login: Joi.string().required().example('crash_override'),
            password: Joi.string().min(8).required().example('hunter2!')
        }
    },
    auth: false
};

controllers.logout = {
    description: 'Log out',
    tags: ['user'],
    handler: function (request, reply) {

        const db = this.db;
        const user = request.auth.credentials.user;

        request.server.log(['users', 'auth'], 'Logout: ' + user.get('email'));

        return reply(user.logout().then(function () {

            return request.generateResponse().code(204);
        }));
    }
};

controllers.me = {
    description: 'Currently logged in user',
    tags: ['user'],
    handler: function (request, reply) {

        const user = request.auth.credentials.user;

        return reply({ data: user });
    }
};

controllers.invites = {
    description: 'Invites for currently logged in user',
    tags: ['user'],
    handler: function (request, reply) {

        const db = this.db;
        const user = request.auth.credentials.user;

        return reply(user.related('invites').fetch().then(function (invites) {

            return { data: invites };
        }));
    }
};

controllers.signup = {
    description: 'Sign up',
    tags: ['user'],
    handler: function (request, reply) {

        const db = this.db;
        const attrs = _.pick(request.payload, ['login', 'name', 'email', 'password']);

        return reply(db.User.signup(this.config.invites, request.payload.invite, attrs).then(function (user) {

            return { data: user };
        })).code(201);
    },
    validate: {
        payload: {
            invite: Joi.string().guid().required(),
            login: Joi.string().required(),
            name: Joi.string().required(),
            email: Joi.string().email().required(),
            password: Joi.string().min(8, 'utf-8').required(),
            passwordConfirm: Joi.ref('password')
        }
    },
    auth: false
};

controllers.validate = {
    description: 'Request email validation',
    tags: ['user'],
    handler: function (request, reply) {

        const db = this.db;
        const user = request.auth.credentials.user;

        return reply(user.validate().then(function (response) {

            return { data: response };
        })).code(202);
    }
};

controllers.confirm = {
    description: 'Confirm email',
    tags: ['user'],
    handler: function (request, reply) {

        const db = this.db;
        const user = request.auth.credentials.user;

        return reply(user.confirm(request.payload).then(function (response) {

            return { data: response };
        }));
    },
    validate: {
        payload: {
            code: Joi.string().guid().required()
        }
    }
};

controllers.recover = {
    description: 'Request password recovery',
    tags: ['user'],
    handler: function (request, reply) {

        const db = this.db;

        /* there is no condition under which we will do anything but this reply
         * so just send it now and do the rest asynchronously
         */
        reply({ data: null }).code(202);
        db.User.recover(request.payload);
    },
    validate: {
        payload: {
            email: Joi.string().email().required()
        }
    },
    auth: false
};

controllers.reset = {
    description: 'Reset password',
    notes: 'Logs out any existing sessions',
    tags: ['user'],
    handler: function (request, reply) {

        const db = this.db;
        const attrs = _.pick(request.payload, ['code', 'password']);

        return reply(db.Recovery.reset(attrs).then(function (authToken) {

            return { data: authToken };
        })).code(201);
    },
    validate: {
        payload: {
            code: Joi.string().guid().required(),
            password: Joi.string().min(8, 'utf-8').required(),
            passwordConfirm: Joi.ref('password')
        }
    },
    auth: false
};

controllers.update = {
    description: 'Update user info',
    tags: ['user'],
    handler: function (request, reply) {

        const user = request.auth.credentials.user;
        const attrs = _.pick(request.payload, 'name', 'email', 'password', 'smartmode', 'visible');

        return reply(user.update(attrs).then(function (updatedUser) {

            return { data: updatedUser };
        }));
    },
    validate: {
        payload: {
            name: Joi.string(),
            password: Joi.string().min(8),
            passwordConfirm: Joi.ref('password'),
            email: Joi.string().email(),
            smartmode: Joi.boolean(),
            visible: Joi.boolean()
        }
    }
};

controllers.taken = {
    description: 'Check login availability',
    tags: ['user'],
    handler: function (request, reply) {

        const db = this.db;

        return reply(db.User.taken(request.payload).then(function (taken) {

            return { data: taken };
        }));
    },
    validate: {
        payload: {
            invite: Joi.string().guid().required(),
            login: Joi.string().required()
        }
    },
    auth: false
};

controllers.invite = {
    description: 'Check invite validity',
    tags: ['user'],
    handler: function (request, reply) {

        const db = this.db;
        return reply(db.Invite.get(request.params).then(function (invite) {

            return { data: invite };
        }));
    },
    validate: {
        params: {
            code: Joi.string().guid().required()
        }
    },
    auth: false
};
