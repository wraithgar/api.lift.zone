'use strict';

const Joi = require('joi');

module.exports = {
  description: 'Get activities for logged in user',
  tags: ['api', 'activity'],
  handler: async function (request, reply) {

    const params = Object.assign({ id: request.auth.credentials.id }, request.query);
    params.page = (params.page - 1) * params.limit;
    const activity_count = await this.db.activities.for_user_count(params);
    request.totalCount = activity_count.count;
    const activities = await this.db.activities.for_user(params);

    return reply(activities);
  },
  validate: {
    query: {
      limit: Joi.number().default(10).min(1).max(100),
      page: Joi.number().default(1).positive()
    }
  },
  response: {
    modify: true,
    schema: Joi.array().items(
      Joi.object({
        user_id: Joi.any().strip(),
        aliases: Joi.array().items(
          Joi.object({
            user_id: Joi.any().strip()
          }).unknown()
        ).allow(null)
      }).unknown()
    )
  }
};
