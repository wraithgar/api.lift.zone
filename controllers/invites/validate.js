'use strict';

const Config = require('getconfig');
const Boom = require('@hapi/boom');
const Joi = require('@hapi/joi');

module.exports = {
  description: 'Check invite validity',
  tags: ['api', 'user'],
  handler: async function(request) {
    const params = { ...request.params, claimed_by: null };
    const invite = await this.db.invites.findOne(params, ['token']);

    if (!invite) {
      throw Boom.notFound();
    }

    return invite;
  },
  validate: {
    params: Joi.object().keys({
      token: Joi.string().guid()
    })
  },
  auth: false,
  plugins: {
    'hapi-rate-limit': Config.inviteValidateRateLimit
  }
};
