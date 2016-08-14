'use strict';

const Boom = require('boom');
const Hoek = require('hoek');
const Joi = require('joi');

const Utils = require('../../lib/utils');

module.exports = {
  description: 'Update a new workout',
  tags: ['workout'],
  handler: function (request, reply) {

    const result = this.db.workouts.findOne({ id: request.params.id }).then((existingId) => {

      if (!existingId) {
        throw Boom.notFound();
      }
      return this.db.workouts.findOne({ date: request.payload.date, user_id: request.auth.credentials.id });
    }).then((existingDate) => {

      if (existingDate && existingDate.id !== request.params.id) {
        throw Boom.conflict(`There is already a workout for ${request.payload.date}`);
      }

      const attrs = Hoek.clone(request.payload);

      return this.db.workouts.updateOne({ id: request.params.id }, attrs);
    });

    return reply(result);
  },
  validate: {
    params: {
      id: Joi.string().guid()
    },
    payload: Utils.workoutValidator
  }
};

