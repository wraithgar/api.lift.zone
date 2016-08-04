'use strict';

const Boom = require('boom');
const Joi = require('joi');

module.exports = {
  description: 'Search for a workout by date',
  tags: ['workout'],
  handler: function (request, reply) {

    const params = Object.assign({}, request.params, { user_id: request.auth.credentials.id });
    const result = this.db.workouts.findOne(params).then((workout) => {

      if (!workout) {
        throw Boom.notFound();
      }

      return workout;
    });

    return reply(result);
  },
  validate: {
    params: {
      date: Joi.date().format('YYYY-MM-DD')
    }
  }
};
