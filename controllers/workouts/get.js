'use strict';

const Joi = require('joi');
const Boom = require('boom');

module.exports = {
  description: 'Get a workout by id',
  tags: ['workout'],
  handler: function (request, reply) {

    const attrs = Object.assign({}, request.params, { user_id: request.auth.credentials.id });
    const result = this.db.workouts.findOne(attrs).then((workout) => {

      if (!workout) {
        throw Boom.notFound();
      }

      return workout;
    });

    return reply(result);
  },
  validate: {
    params: {
      id: Joi.string().guid()
    }
  }
};
