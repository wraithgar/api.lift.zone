'use strict';

const Joi = require('joi');

module.exports = {
  description: 'Update user info',
  tags: ['user'],
  handler: function (request, reply) {


    const attrs = Object.assign({}, request.payload);

    if (attrs.email) {
      attrs.validated = false;
    }

    const result = this.db.users.updateOne({ id: request.auth.credentials.id }, attrs);

    return reply(result);
  },
  validate: {
    payload: {
      name: Joi.string(),
      email: Joi.string().email(),
      preferences: Joi.object({
        smartmode: Joi.boolean(),
        visible: Joi.boolean()
      })
    }
  },
  response: {
    modify: true,
    schema: Joi.object({
      hash: Joi.any().strip()
    }).unknown()
  }
};
