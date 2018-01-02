'use strict';

const Joi = require('joi');
const Boom = require('boom');

module.exports = {
  description: 'Get a public workout by id',
  tags: ['api', 'workout'],
  handler: async function (request, h) {

    const workout = await this.db.workouts.public(request.params);

    if (!workout) {
      throw Boom.notFound();
    }

    return workout;
  },
  validate: {
    params: {
      id: Joi.string().guid()
    }
  },
  auth: false,
  response: {
    modify: true,
    schema: Joi.object({
      user_id: Joi.any().strip()
    }).unknown()
  }
};

