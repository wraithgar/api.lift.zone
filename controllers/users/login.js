'use strict';
const Boom = require('boom');
const Config = require('getconfig');
const JWT = require('jsonwebtoken');
const Joi = require('joi');

module.exports = {
  description: 'Authenticates a user and returns a JWT',
  tags: ['api', 'user'],
  handler: async function (request, reply) {

    request.server.log(['users', 'auth'], `Login: ${request.payload.email}`);

    const user = await this.db.users.active(request.payload.email);

    if (!user) {
      throw Boom.unauthorized();
    }

    const valid = await this.utils.bcryptCompare(request.payload.password, user);

    if (!valid) {
      throw Boom.unauthorized();
    }

    delete user.hash;
    user.timestamp = new Date();
    return reply({ token: JWT.sign(user, Config.auth.secret, Config.auth.options) }).code(201);
  },
  validate: {
    payload: {
      email: Joi.string().required(),
      password: Joi.string().min(8).required()
    }
  },
  auth: false
};
