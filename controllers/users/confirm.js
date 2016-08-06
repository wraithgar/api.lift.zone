'use strict';

const Boom = require('boom');
const Joi = require('joi');

module.exports = {
  description: 'Confirm email',
  tags: ['user'],
  handler: function (request, reply) {

    const result = this.db.validations.confirm({ user_id: request.auth.credentials.id, token: request.payload.token }).then((validation) => {

      if (!validation) {

        throw Boom.notFound('Invalid Token');
      }
      return this.db.tx((tx) => {

        return tx.validations.destroy({ user_id: validation.user_id }).then(() => {

          return tx.users.updateOne({ id: request.auth.credentials.id }, { validated: true });
        });
      });
    });
    return reply(result);

  },
  validate: {
    payload: {
      token: Joi.string().guid().required()
    }
  }
};
