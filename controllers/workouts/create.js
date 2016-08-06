'use strict';

const Boom = require('boom');
const Hoek = require('hoek');

const Utils = require('../../lib/utils');

module.exports = {
  description: 'Create a new workout',
  tags: ['workout'],
  handler: function (request, reply) {

    const result = this.db.workouts.findOne({ date: request.payload.date }).then((existing) => {

      if (existing) {
        throw Boom.conflict(`There is already a workout for ${request.payload.date}`);
      }

      const attrs = Hoek.clone(request.payload);

      attrs.user_id = request.auth.credentials.id;

      return this.db.workouts.insert(attrs);
    });

    return reply(result).code(201);
  },
  validate: {
    payload: Utils.workoutValidator
  }
};
