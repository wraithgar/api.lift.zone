'use strict'

const Joi = require('@hapi/joi')
const Boom = require('@hapi/boom')

module.exports = {
  description: 'Get a public workout by id',
  tags: ['api', 'workout'],
  handler: async function (request) {
    const workout = await this.db.workouts.public(request.params)

    if (!workout) {
      throw Boom.notFound()
    }

    return workout
  },
  validate: {
    params: Joi.object().keys({
      id: Joi.string().guid()
    })
  },
  auth: false,
  response: {
    modify: true,
    schema: Joi.object({
      user_id: Joi.any().strip()
    }).unknown()
  }
}
