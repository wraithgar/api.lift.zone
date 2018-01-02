'use strict';
const Bcrypt = require('bcrypt');
const Boom = require('boom');
const Config = require('getconfig');
const Joi = require('joi');
const JWT = require('jsonwebtoken');

module.exports = {
  description: 'Authenticates a user and returns a JWT',
  tags: ['api', 'user'],
  handler: async function (request, h) {

    request.server.log(['users', 'auth'], `Login: ${request.payload.email}`);

    const user = await this.db.users.active(request.payload.email);

    if (!user) {
      throw Boom.unauthorized();
    }

    const valid = await Bcrypt.compare(request.payload.password, user.hash);

    if (!valid) {
      throw Boom.unauthorized();
    }

    delete user.hash;
    user.timestamp = new Date();
    return h.response({ token: JWT.sign({ ...user }, Config.auth.secret, Config.auth.options) }).code(201);
  },
  validate: {
    payload: {
      email: Joi.string().required(),
      password: Joi.string().min(8).required()
    }
  },
  auth: false
};
