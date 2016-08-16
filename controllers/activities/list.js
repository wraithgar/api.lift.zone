'use strict';

const Joi = require('joi');

module.exports = {
  description: 'Get activities for logged in user',
  tags: ['activity'],
  handler: function (request, reply) {

    const result = this.db.activities.for_user(request.auth.credentials.id);

    return reply(result);
  },
  response: {
    modify: true,
    schema: Joi.array().items(
      Joi.object({
        user_id: Joi.any().strip(),
        aliases: Joi.array().items(
          Joi.object({
            user_id: Joi.any().strip()
          }).unknown()
        ).allow(null)
      }).unknown()
    )
  }
};
