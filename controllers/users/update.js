'use strict';

const Bcrypt = require('bcrypt');
const Boom = require('@hapi/boom');
const Config = require('getconfig');
const Joi = require('@hapi/joi');

module.exports = {
  description: 'Update user info',
  tags: ['api', 'user'],
  handler: async function(request) {
    const credentials = request.auth.credentials;
    const { hash } = await this.db.users.findOne({ id: credentials.id }, [
      'hash'
    ]);
    const valid = await Bcrypt.compare(request.payload.currentPassword, hash);

    if (!valid) {
      throw Boom.badRequest('Current password does not match');
    }

    const attrs = { ...request.payload };

    if (attrs.email) {
      attrs.validated = false;
    }
    if (attrs.newPassword) {
      attrs.hash = await Bcrypt.hash(attrs.newPassword, Config.saltRounds);
    }
    delete attrs.currentPassword;
    delete attrs.newPassword;

    const updatedUser = await this.db.users.updateOne(
      { id: request.auth.credentials.id },
      attrs
    );

    const result = await this.db.users.active(updatedUser.email);

    return result;
  },
  validate: {
    payload: Joi.object()
      .keys({
        name: Joi.string(),
        email: Joi.string().email(),
        currentPassword: Joi.string()
          .min(8, 'utf-8')
          .required(),
        newPassword: Joi.string().min(8, 'utf-8'),
        confirmPassword: Joi.any()
          .valid(Joi.ref('newPassword'))
          .strip(),
        preferences: Joi.object({
          weightUnit: Joi.string().valid('lb', 'kg'),
          dateFormat: Joi.string(),
          smartmode: Joi.boolean(),
          visible: Joi.boolean()
        })
      })
      .with('newPassword', 'currentPassword')
  },
  response: {
    modify: true,
    schema: Joi.object({
      hash: Joi.any().strip()
    }).unknown()
  }
};
