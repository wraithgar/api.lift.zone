'use strict';

const Bcrypt = require('bcrypt');
const Boom = require('@hapi/boom');
const Config = require('getconfig');
const JWT = require('jsonwebtoken');
const Joi = require('@hapi/joi');

module.exports = {
  description: 'Sign up',
  tags: ['api', 'user'],
  handler: async function(request, h) {
    const invite = await this.db.invites.findOne({
      token: request.payload.invite,
      claimed_by: null
    });

    if (!invite) {
      throw Boom.notFound('Invalid invite');
    }
    const hash = await Bcrypt.hash(request.payload.password, Config.saltRounds);

    await this.db.tx(async tx => {
      const user = await tx.users.insert({
        name: request.payload.name,
        email: request.payload.email,
        hash
      });

      for (let i = 0; i < Config.invites.count; ++i) {
        await tx.invites.insert({ user_id: user.id });
      }

      await tx.invites.update(
        { token: request.payload.invite },
        { claimed_by: user.id }
      );
    });

    const user = await this.db.users.active(request.payload.email);

    user.timestamp = new Date();
    return h
      .response({
        token: JWT.sign({ ...user }, Config.auth.secret, Config.auth.options)
      })
      .code(201);
  },
  validate: {
    payload: Joi.object().keys({
      invite: Joi.string()
        .guid()
        .required(),
      name: Joi.string().required(),
      email: Joi.string()
        .email()
        .required(),
      password: Joi.string()
        .min(8, 'utf-8')
        .required(),
      passwordConfirm: Joi.any()
        .valid(Joi.ref('password'))
        .strip()
    })
  },
  auth: false
};
