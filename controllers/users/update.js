'use strict';

const Joi = require('joi');
const Boom = require('boom');

module.exports = {
  description: 'Update user info',
  tags: ['api', 'user'],
  handler: function (request, reply) {

    const result = this.db.users.findOne({ id: request.auth.credentials.id }).then((user) => {

      return this.utils.bcryptCompare(request.payload.currentPassword, user);
    }).then((user) => {

      if (!user) {
        throw Boom.badRequest('Current password does not match');
      }
      const attrs = Object.assign({}, request.payload);

      if (attrs.email) {
        attrs.validated = false;
      }
      if (attrs.newPassword) {
        return this.utils.bcryptHash(attrs.newPassword).then((hash) => {

          attrs.hash = hash;
          return attrs;
        });
      }
      return attrs;
    }).then((attrs) => {

      delete attrs.currentPassword;
      delete attrs.newPassword;
      return this.db.users.updateOne({ id: request.auth.credentials.id }, attrs);
    });

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
