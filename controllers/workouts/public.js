'use strict';

const Joi = require('joi');
const Boom = require('boom');

module.exports = {
  description: 'Get a public workout by id',
  tags: ['api', 'workout'],
  handler: function (request, reply) {

    const result = this.db.workouts.public(request.params).then((workout) => {

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
  },
  auth: false,
  response: {
    modify: true,
    schema: Joi.object({
      user_id: Joi.any().strip()
    }).unknown()
  }
};

