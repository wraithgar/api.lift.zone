'use strict';

const Boom = require('@hapi/boom');
const Joi = require('@hapi/joi');

module.exports = {
  description: 'Get activity by id',
  tags: ['api', 'activity'],
  handler: async function(request) {
    const activity = await this.db.activities.with_alias({
      id: request.params.id,
      user_id: request.auth.credentials.id
    });

    if (!activity) {
      throw Boom.notFound();
    }

    return activity;
  },
  validate: {
    params: Joi.object().keys({
      id: Joi.string().guid()
    })
  }
};
