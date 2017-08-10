'use strict';

const Config = require('getconfig');
const Boom = require('boom');
const Joi = require('joi');

module.exports = {
  description: 'Check invite validity',
  tags: ['api', 'user'],
  handler: async function (request, reply) {

    const params = Object.assign({}, request.params, { claimed_by: null });
    const invite = await this.db.invites.findOne(params, ['token']);

    if (!invite) {
      throw Boom.notFound();
    }

    return reply(invite);
  },
  validate: {
    params: {
      token: Joi.string().guid()
    }
  },
  auth: false,
  plugins: {
    'hapi-rate-limit': Config.inviteValidateRateLimit
  }
};
