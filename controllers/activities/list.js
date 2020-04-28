'use strict'

const Joi = require('@hapi/joi')

module.exports = {
  description: 'Get activities for logged in user',
  tags: ['api', 'activity'],
  handler: async function (request) {
    const params = { ...request.query, id: request.auth.credentials.id }
    params.page = (params.page - 1) * params.limit
    const activityCount = await this.db.activities.for_user_count(params)
    request.totalCount = activityCount.count
    const activities = await this.db.activities.for_user(params)

    return activities
  },
  validate: {
    query: Joi.object().keys({
      limit: Joi.number()
        .default(10)
        .min(1)
        .max(100),
      page: Joi.number()
        .default(1)
        .positive()
    })
  },
  response: {
    modify: true,
    schema: Joi.array().items(
      Joi.object({
        user_id: Joi.any().strip(),
        aliases: Joi.array()
          .items(
            Joi.object({
              user_id: Joi.any().strip()
            }).unknown()
          )
          .allow(null)
      }).unknown()
    )
  }
}
