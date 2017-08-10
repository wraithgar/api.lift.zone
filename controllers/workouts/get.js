'use strict';

const Joi = require('joi');
const Boom = require('boom');

module.exports = {
  description: 'Get a workout by id',
  tags: ['api', 'workout'],
  handler: async function (request, reply) {

    const attrs = Object.assign({}, request.params, { user_id: request.auth.credentials.id });
    const workout = await this.db.workouts.findOne(attrs);

    if (!workout) {
      throw Boom.notFound();
    }

    return reply(workout);
  },
  validate: {
    params: {
      id: Joi.string().guid()
    }
  }
};
