'use strict';

const Config = require('getconfig');
const Boom = require('boom');
const Joi = require('joi');

module.exports = {
  description: 'Check invite validity',
  tags: ['user'],
  handler: function (request, reply) {

    const result = this.db.invites.findOne(request.params).then((invite) => {

      if (!invite) {
        throw Boom.notFound();
      }

      return null;
    });

    return reply(result).code(204);
  },
  validate: {
    params: {
      token: Joi.string().guid().required()
    }
  },
  auth: false,
  plugins: {
    'hapi-rate-limit': Config.inviteValidateRateLimit
  }
};
