'use strict';

const Boom = require('boom');
const Joi = require('joi');

module.exports = {
  description: 'Create a new activity',
  tags: ['activity'],
  handler: function (request, reply) {

    const user_id = request.auth.credentials.id;

    const result = Promise.resolve().then(() => {

      if (request.payload.activity_id) {
        return this.db.activities.findOne({ user_id, id: request.payload.activity_id }).then((alias) => {

          if (!alias) {
            throw Boom.notFound(`Alias activity ${request.payload.activity_id} does not exist}`);
          }
        });
      }
    }).then(() => {

      const attrs = Object.assign({}, { user_id }, request.payload);
      return this.db.tx((tx) => {

        return tx.activities.insert(attrs).then((activity) => {

          if (!activity.activity_id) {

            return tx.activities.updateOne({ id: activity.id }, { activity_id: activity.id });
          }
          return activity;
        });
      });
    });

    return reply(result).code(201);
  },
  validate: {
    payload: {
      name: Joi.string(),
      activity_id: Joi.string().guid(),
      sets: Joi.any().strip(),
      suggestions: Joi.any().strip()
    }
  },
  response: {
    modify: true,
    schema: Joi.object({
      user_id: Joi.any().strip()
    }).unknown()
  }
};

