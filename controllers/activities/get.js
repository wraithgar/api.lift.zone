'use strict';

const Boom = require('boom');
const Joi = require('joi');

module.exports = {
  description: 'Get activity by id',
  tags: ['api', 'activity'],
  handler: async function (request, h) {

    const activity = await this.db.activities.with_alias({ id: request.params.id, user_id: request.auth.credentials.id });

    if (!activity) {
      throw Boom.notFound();
    }

    return activity;
  },
  validate: {
    params: {
      id: Joi.string().guid()
    }
  }
};
