'use strict';

const Boom = require('boom');
const Joi = require('joi');

module.exports = {
  description: 'Delete a workout',
  tags: ['api', 'workout'],
  handler: function (request, reply) {

    const result = this.db.workouts.findOne({ id: request.params.id, user_id: request.auth.credentials.id }).then((existing) => {

      if (!existing) {
        throw Boom.notFound();
      }

      return this.db.workouts.destroy({ id: existing.id });
    });

    return reply(result).code(204);
  },
  validate: {
    params: {
      id: Joi.string().guid()
    }
  }
};
