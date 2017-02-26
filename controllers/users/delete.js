'use strict';

const Joi = require('joi');

module.exports = {
  description: 'Delete user',
  notes: 'The query parameter "confirm" is meant to aid clients in confirming with the end user that they really want to do this',
  tags: ['user'],
  handler: function (request, reply) {

    const result = this.db.users.destroy({ id: request.auth.credentials.id });

    return reply(result).code(204);
  },
  validate: {
    query: {
      confirm: Joi.boolean().valid(true).required()
    }
  }
};
