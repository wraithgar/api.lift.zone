'use strict';

const Boom = require('boom');
const Joi = require('joi');
const Config = require('getconfig');
const JWT = require('jsonwebtoken');

module.exports = {
  description: 'Reset password using recovery token',
  notes: 'Logs out any existing sessions',
  tags: ['user'],
  handler: async function (request, reply) {

    const recovery = await this.db.recoveries.findOne({ token: request.payload.token });

    if (!recovery) {
      throw Boom.notFound('Invalid token');
    }

    const hash = await this.utils.bcryptHash(request.payload.password);

    await this.db.tx(async (tx) => {

      await Promise.all([
        tx.recoveries.destroy({ token: recovery.token }),
        tx.users.updateOne({ email: recovery.email }, { hash, logout: new Date() })
      ]);
    });

    const user = await this.db.users.active(recovery.email);

    delete user.hash;
    user.timestamp = new Date();
    return reply({ token: JWT.sign({ ...user }, Config.auth.secret, Config.auth.options) }).code(201);
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
