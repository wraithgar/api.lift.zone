'use strict';

const Boom = require('@hapi/boom');
const Joi = require('@hapi/joi');

module.exports = {
  description: 'Create a new activity',
  tags: ['api', 'activity'],
  handler: async function(request, h) {
    const user_id = request.auth.credentials.id;

    if (request.payload.activity_id) {
      const alias = await this.db.activities.findOne({
        user_id,
        id: request.payload.activity_id,
        activity_id: null
      });

      if (!alias) {
        throw Boom.notFound(
          `Alias activity ${request.payload.activity_id} does not exist}`
        );
      }
    }

    const attrs = { ...request.payload, user_id };
    const result = await this.db.activities.insert(attrs);

    return h.response(result).code(201);
  },
  validate: {
    payload: Joi.object().keys({
      name: Joi.string().required(),
      activity_id: Joi.string().guid(),
      sets: Joi.any().strip(),
      comment: Joi.any().strip(),
      aliases: Joi.any().strip(),
      suggestions: Joi.any().strip()
    })
  },
  response: {
    modify: true,
    schema: Joi.object({
      user_id: Joi.any().strip()
    }).unknown()
  }
};
