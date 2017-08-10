'use strict';

const Boom = require('boom');

const Utils = require('../../lib/utils');

module.exports = {
  description: 'Create a new workout',
  tags: ['api', 'workout'],
  handler: async function (request, reply) {

    const existing = await this.db.workouts.findOne({ date: request.payload.date, user_id: request.auth.credentials.id });

    if (existing) {
      throw Boom.conflict(`There is already a workout for ${request.payload.date}`);
    }

    const attrs = Object.assign(request.payload, { user_id: request.auth.credentials.id });

    return reply(this.db.workouts.insert(attrs)).code(201);
  },
  validate: {
    payload: Utils.workoutValidator
  }
};
