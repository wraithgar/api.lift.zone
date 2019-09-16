'use strict';

const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');

module.exports = {
  description: 'Get a workout by id',
  tags: ['api', 'workout'],
  handler: async function(request) {
    const attrs = { ...request.params, user_id: request.auth.credentials.id };
    const workout = await this.db.workouts.findOne(attrs);

    if (!workout) {
      throw Boom.notFound();
    }

    return workout;
  },
  validate: {
    params: Joi.object().keys({
      id: Joi.string().guid()
    })
  }
};
