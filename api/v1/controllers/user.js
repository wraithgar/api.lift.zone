var Joi = require('joi');

var controllers = {};

controllers.login = {
    description: 'Log in',
    tags: ['user'],
    handler: function (request, reply) {

        var db = this.db;
        var data = request.payload.data;

        request.server.log(['users', 'auth'], 'Login: ' + data.attributes.email);

        return reply(db.User.loginWithPassword(data.attributes).then(function (user) {

            return { data: user };
        })).code(201);
    },
    validate: {
        payload: {
            data: {
                type: Joi.string().valid('login').required(),
                attributes: {
                    login: Joi.string().required().example('crash_override'),
                    password: Joi.string().min(8).required().example('hunter2!')
                }
            }
        }
    },
    auth: false
};

controllers.logout = {
    description: 'Log out',
    tags: ['user'],
    handler: function (request, reply) {

        var db = this.db;
        var user = request.auth.credentials.user;

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

        var user = request.auth.credentials.user;

        return reply({ data: user });
    }
};

controllers.invites = {
    description: 'Invites for currently logged in user',
    tags: ['user'],
    handler: function (request, reply) {

        var db = this.db;
        var user = request.auth.credentials.user;

        return reply(user.getInvites().then(function (invites) {

            return { data: invites };
        }));
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

        return reply(db.User.signup(this.config.invites, data.attributes.invite, attrs).then(function (user) {

            return { data: user };
        })).code(201);
    },
    validate: {
        payload: {
            data: {
                type: Joi.string().valid('signup').required(),
                attributes: Joi.object().keys({
                    invite: Joi.string().guid().required(),
                    login: Joi.string().required(),
                    name: Joi.string().required(),
                    password: Joi.string().min(8, 'utf-8').required(),
                    passwordConfirm: Joi.ref('password'),
                    email: Joi.string().email().required()
                })
            }
        }
    },
    auth: false
};

controllers.validate = {
    description: 'Request email validation',
    tags: ['user'],
    handler: function (request, reply) {

        var db = this.db;
        var user = request.auth.credentials.user;

        return reply(user.validate().then(function (response) {

            return { data: response };
        })).code(202);
    }
};

controllers.confirm = {
    description: 'Confirm email',
    tags: ['user'],
    handler: function (request, reply) {

        var db = this.db;
        var user = request.auth.credentials.user;

        return reply(user.confirm(request.payload.data).then(function (response) {

            return { data: response };
        }));
    },
    validate: {
        payload: {
            data: {
                type: Joi.string().valid('validation').required(),
                id: Joi.string().guid().required()
            }
        }
    }
};

controllers.recover = {
    description: 'Request password recovery',
    tags: ['user'],
    handler: function (request, reply) {

        var db = this.db;

        /* there is no condition under which we will do anything but this reply
         * so just send it now and do the rest asynchronously
         */
        reply({ data: null }).code(202);
        db.User.recover(request.payload.data.attributes);
    },
    validate: {
        payload: {
            data: {
                type: Joi.string().valid('login').required(),
                attributes: {
                    email: Joi.string().email().required()
                }
            }
        }
    },
    auth: false
};

controllers.reset = {
    description: 'Reset password',
    notes: 'Logs out any existing sessions',
    tags: ['user'],
    handler: function (request, reply) {

        var db = this.db;

        return reply(db.Recovery.reset(request.payload.data.attributes).then(function (authToken) {

            return { data: authToken };
        })).code(201);
    },
    validate: {
        payload: {
            data: Joi.object().keys({
                type: Joi.string().valid('reset').required(),
                attributes: {
                    code: Joi.string().guid().required(),
                    password: Joi.string().min(8, 'utf-8').required(),
                    passwordConfirm: Joi.ref('password')
                }
            })
        }
    },
    auth: false
};

controllers.update = {
    description: 'Update user info',
    tags: ['user'],
    handler: function (request, reply) {

        var user = request.auth.credentials.user;
        return reply(user.update(request.payload.data.attributes).then(function (updatedUser) {

            return { data: updatedUser };
        }));
    },
    validate: {
        payload: {
            data: {
                type: Joi.string().valid('user').required(),
                id: Joi.ref('$auth.credentials.user.id'),
                attributes: Joi.object().keys({
                    name: Joi.string(),
                    password: Joi.string().min(8),
                    passwordConfirm: Joi.ref('password'),
                    email: Joi.string().email(),
                    smartmode: Joi.boolean(),
                    'public': Joi.boolean()
                }).unknown()
            }
        }
    }
};

controllers.taken = {
    description: 'Check login availability',
    tags: ['user'],
    handler: function (request, reply) {

        var db = this.db;
        return reply(db.User.taken(request.payload.data.attributes).then(function (taken) {

            return { data: taken };
        }));
    },
    validate: {
        payload: {
            data: {
                type: Joi.string().valid('taken').required(),
                id: Joi.string().valid('taken').required(),
                attributes: {
                    invite: Joi.string().guid().required(),
                    login: Joi.string().required()
                }
            }
        }
    },
    auth: false
};

controllers.invite = {
    description: 'Check invite validity',
    tags: ['user'],
    handler: function (request, reply) {

        var db = this.db;
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

module.exports = controllers;
