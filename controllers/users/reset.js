'use strict';

const Boom = require('boom');
const Joi = require('joi');
const Config = require('getconfig');
const JWT = require('jsonwebtoken');

module.exports = {
  description: 'Reset password using recovery token',
  notes: 'Logs out any existing sessions',
  tags: ['user'],
  handler: function (request, reply) {

    const result = this.db.recoveries.findOne({ token: request.payload.token }).then((recovery) => {

      if (!recovery) {
        throw Boom.notFound('Invalid token');
      }

      return this.utils.bcryptHash(request.payload.password).then((hash) => {

        return this.db.tx((tx) => {

          return tx.recoveries.destroy({ token: recovery.token }).then(() => {

            return tx.users.updateOne({ email: recovery.email }, { hash, logout: new Date() });
          });
        });
      });
    }).then((user) => {

      delete user.hash;
      user.timestamp = new Date();
      return { token: JWT.sign(user, Config.auth.secret, Config.auth.options) };
    });

    return reply(result).code(201);
  },
  validate: {
    payload: {
      token: Joi.string().guid().required(),
      password: Joi.string().min(8, 'utf-8').required(),
      passwordConfirm: Joi.any().valid(Joi.ref('password')).strip()
    }
  },
  auth: false
};
