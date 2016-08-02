'use strict';

const Boom = require('boom');
const Config = require('getconfig');
const JWT = require('jsonwebtoken');
const Joi = require('joi');
const _ = require('lodash');

module.exports = {
  description: 'Sign up',
  tags: ['user'],
  handler: function (request, reply) {

    const result = this.db.invites.findOne({ token: request.payload.invite, claimed_by: null }).then((invite) => {

      if (!invite) {

        throw Boom.notFound('Invalid invite');
      }
    }).then(() => {

      return this.utils.bcryptHash(request.payload.password).then((hash) => {

        return this.db.tx((tx) => {

          return tx.users.insert({
            name: request.payload.name,
            email: request.payload.email,
            hash
          }).then((user) => {

            return Promise.all(_.times(Config.invites.count, () => {

              return tx.invites.insert({ user_id: user.id });
            })).then(() => {

              return tx.invites.update({ token: request.payload.invite }, { claimed_by: user.id });
            }).then(() => {

              return { token: JWT.sign(user, Config.auth.secret, Config.auth.options) };
            });
          });
        });
      });
    });

    return reply(result).code(201);
  },
  validate: {
    payload: {
      invite: Joi.string().guid().required(),
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(8, 'utf-8').required(),
      passwordConfirm: Joi.any().valid(Joi.ref('password')).strip()
    }
  },
  auth: false
};
