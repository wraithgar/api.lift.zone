'use strict';

const Boom = require('boom');
const Joi = require('joi');

module.exports = {
  description: 'Delete a workout',
  tags: ['api', 'workout'],
  handler: async function (request, h) {

    const existing = await this.db.workouts.findOne({ id: request.params.id, user_id: request.auth.credentials.id });

    if (!existing) {
      throw Boom.notFound();
    }

    await this.db.workouts.destroy({ id: existing.id });

    return h.response().code(204);
  },
  validate: {
    params: {
      id: Joi.string().guid()
    }
  }
};
