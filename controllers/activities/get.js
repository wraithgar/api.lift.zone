'use strict';

const Boom = require('boom');
const Joi = require('joi');

module.exports = {
  description: 'Get activity by id',
  tags: ['activity'],
  handler: function (request, reply) {

    const result =  this.db.activities.with_alias({ id: request.params.id, user_id: request.auth.credentials.id }).then((activity) => {

      if (!activity) {
        throw Boom.notFound();
      }

      return activity;
    });

    return reply(result);
  },
  validate: {
    params: {
      id: Joi.string().guid()
    }
  }
  //TODO strip user_id
};
