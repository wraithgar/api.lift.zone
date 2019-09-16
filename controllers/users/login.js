'use strict';
const Bcrypt = require('bcrypt');
const Boom = require('@hapi/boom');
const Config = require('getconfig');
const Joi = require('@hapi/joi');
const JWT = require('jsonwebtoken');

module.exports = {
  description: 'Authenticates a user and returns a JWT',
  tags: ['api', 'user'],
  handler: async function(request, h) {
    request.server.log(['users', 'auth'], `Login: ${request.payload.email}`);

    const user = await this.db.users.active(request.payload.email);

    if (!user) {
      throw Boom.unauthorized();
    }
    const { hash } = await this.db.users.findOne({ id: user.id }, ['hash']);

    const valid = await Bcrypt.compare(request.payload.password, hash);

    if (!valid) {
      throw Boom.unauthorized();
    }

    user.timestamp = new Date();
    return h
      .response({
        token: JWT.sign({ ...user }, Config.auth.secret, Config.auth.options)
      })
      .code(201);
  },
  validate: {
    payload: Joi.object().keys({
      email: Joi.string().required(),
      password: Joi.string()
        .min(8)
        .required()
    })
  },
  auth: false
};
