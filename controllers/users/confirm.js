'use strict';

const Boom = require('boom');
const Joi = require('joi');

module.exports = {
  description: 'Confirm email',
  tags: ['api', 'user'],
  handler: async function (request, h) {

    const validation = await this.db.validations.confirm({ user_id: request.auth.credentials.id, token: request.payload.token });

    if (!validation) {
      throw Boom.notFound('Invalid Token');
    }

    await this.db.tx(async (tx) => {

      await Promise.all([
        tx.validations.destroy({ user_id: validation.user_id }),
        tx.users.updateOne({ id: request.auth.credentials.id }, { validated: true })
      ]);
    });

    const user = await this.db.users.active(request.auth.credentials.email);

    return user;
  },
  validate: {
    payload: {
      token: Joi.string().guid().required()
    }
  }
};
