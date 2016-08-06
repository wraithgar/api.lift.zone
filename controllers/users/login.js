'use strict';
const Boom = require('boom');
const Config = require('getconfig');
const JWT = require('jsonwebtoken');
const Joi = require('joi');

module.exports = {
  description: 'Authenticates a user and returns a JWT',
  tags: ['users'],
  handler: function (request, reply) {

    request.server.log(['users', 'auth'], `Login: ${request.payload.email}`);

    const result = this.db.users.findOne({ email: request.payload.email, active: true }).then((user) => {

      if (!user) {
        throw Boom.unauthorized();
      }

      return this.utils.bcryptCompare(request.payload.password, user);
    }).then((user) => {

      if (!user) {
        throw Boom.unauthorized();
      }

      delete user.hash;
      user.timestamp = new Date();
      return { token: JWT.sign(user, Config.auth.secret, Config.auth.options) };
    });

    return reply(result).code(201);
  },
  validate: {
    payload: {
      email: Joi.string().required(),
      password: Joi.string().min(8).required()
    }
  },
  auth: false
};
