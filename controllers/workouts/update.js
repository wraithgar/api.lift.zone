'use strict'

const Boom = require('@hapi/boom')
const Joi = require('@hapi/joi')

const Utils = require('../../lib/utils')

module.exports = {
  description: 'Update a new workout',
  tags: ['api', 'workout'],
  handler: async function (request) {
    const existingId = await this.db.workouts.findOne({
      id: request.params.id
    })

    if (!existingId) {
      throw Boom.notFound()
    }

    const existingDate = await this.db.workouts.findOne({
      date: request.payload.date,
      user_id: request.auth.credentials.id
    })

    if (existingDate && existingDate.id !== request.params.id) {
      throw Boom.conflict(
                `There is already a workout for ${request.payload.date}`
      )
    }

    const attrs = { ...request.payload }

    const workout = await this.db.workouts.updateOne(
      { id: request.params.id },
      attrs
    )

    return workout
  },
  validate: {
    params: Joi.object().keys({
      id: Joi.string().guid()
    }),
    payload: Utils.workoutValidator
  }
}
