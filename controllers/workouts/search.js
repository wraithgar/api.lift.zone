'use strict';

const Joi = require('joi');
const Moment = require('moment');
const _ = require('lodash');

module.exports = {
  description: 'Search for a workout by date',
  tags: ['workout'],
  handler: function (request, reply) {

    const params = Object.assign({}, request.params, { user_id: request.auth.credentials.id });
    const result = this.db.workouts.for_year(params).then((workouts) => {

      return _.groupBy(workouts, (workout) => {

        return Moment(workout.date).format('YYYY-MM-DD');
      });
    });

    return reply(result);
  },
  validate: {
    params: {
      year: Joi.number().min(1900).max(2020)
    }
  }
};
