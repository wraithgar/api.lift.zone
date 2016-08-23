'use strict';

const Joi = require('joi');

module.exports = {
  description: 'Get workout history for an activity by id',
  handler: function (request, reply) {

    const result =  this.db.activities.history({ id: request.params.id, user_id: request.auth.credentials.id });

    return reply(result);
  },
  validate: {
    params: {
      id: Joi.string().guid()
    }
  }
};
