'use strict';

const Joi = require('joi');
const Boom = require('boom');

module.exports = {
  description: 'Update user info',
  tags: ['api', 'user'],
  handler: async function (request, reply) {

    const user = await this.db.users.active(request.auth.credentials.email);

    const valid = await this.utils.bcryptCompare(request.payload.currentPassword, user);

    if (!valid) {
      throw Boom.badRequest('Current password does not match');
    }

    const attrs = { ...request.payload };

    if (attrs.email) {
      attrs.validated = false;
    }
    if (attrs.newPassword) {
      attrs.hash = await this.utils.bcryptHash(attrs.newPassword);
    }
    delete attrs.currentPassword;
    delete attrs.newPassword;

    const updatedUser = await this.db.users.updateOne({ id: request.auth.credentials.id }, attrs);

    const result = this.db.users.active(updatedUser.email);

    return reply(result);
  },
  validate: {
    payload: Joi.object().keys({
      name: Joi.string(),
      email: Joi.string().email(),
      currentPassword: Joi.string().min(8, 'utf-8').required(),
      newPassword: Joi.string().min(8, 'utf-8'),
      confirmPassword: Joi.any().valid(Joi.ref('newPassword')).strip(),
      preferences: Joi.object({
        weightUnit: Joi.string().valid('lb', 'kg'),
        dateFormat: Joi.string(),
        smartmode: Joi.boolean(),
        visible: Joi.boolean()
      })
    }).with('newPassword', 'currentPassword')
  },
  response: {
    modify: true,
    schema: Joi.object({
      hash: Joi.any().strip()
    }).unknown()
  }
};
