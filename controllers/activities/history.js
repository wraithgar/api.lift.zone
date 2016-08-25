'use strict';

const Boom = require('boom');
const Joi = require('joi');

module.exports = {
  description: 'Get workout history for an activity by id',
  handler: function (request, reply) {

    const result = this.db.activities.findOne({ id: request.params.id, user_id: request.auth.credentials.id }).then((activity) => {

      if (!activity) {
        throw Boom.notFound();
      }

      let id = activity.id;
      if (activity.activity_id) {
        id = activity.activity_id;
      }
      //id is now the real activity
      return this.db.activities.history({ id, user_id: request.auth.credentials.id });
    });

    return reply(result);
  },
  validate: {
    params: {
      id: Joi.string().guid()
    }
  }
};
