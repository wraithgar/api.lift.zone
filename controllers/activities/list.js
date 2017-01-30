'use strict';

const Joi = require('joi');

module.exports = {
  description: 'Get activities for logged in user',
  tags: ['activity'],
  handler: function (request, reply) {

    const params = Object.assign({ id: request.auth.credentials.id }, request.query);
    params.page = (params.page - 1) * params.limit;
    const result = this.db.activities.for_user_count(params).then((activity_count) => {

      request.totalCount = activity_count.count;
      return this.db.activities.for_user(params);
    });

    return reply(result);
  },
  validate: {
    query: {
      limit: Joi.number().default(10).min(1).max(100),
      page: Joi.number().default(0).min(0)
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
  },
  plugins: {
    pagination: {
      enabled: true
    }
  }
};
