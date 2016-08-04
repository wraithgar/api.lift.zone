'use strict';

const Config = require('getconfig');
const Boom = require('boom');
const Joi = require('joi');

module.exports = {
  description: 'Check invite validity',
  tags: ['user'],
  handler: function (request, reply) {

    const params = Object.assign({}, request.params, { claimed_by: null });
    const result = this.db.invites.findOne(params, ['token']).then((invite) => {

      if (!invite) {
        throw Boom.notFound();
      }

      return invite;
    });

    return reply(result);
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
