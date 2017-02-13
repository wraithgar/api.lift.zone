'use strict';

const Boom = require('boom');
const Joi = require('joi');

module.exports = {
  description: 'Get workout history for an activity by id',
  handler: function (request, reply) {

    const params = Object.assign({ user_id: request.auth.credentials.id }, request.params);

    const result = this.db.activities.findOne(params).then((activity) => {

      if (!activity) {
        throw Boom.notFound();
      }

      let id = activity.id;
      if (activity.activity_id) {
        id = activity.activity_id;
      }
      //id is now the real activity
      return this.db.activities.history_count({ id, user_id: request.auth.credentials.id }).then((history_count) => {

        request.totalCount = history_count.count;

        if (request.query.page === 0) {
          request.query.page = this.utils.lastPage(history_count.count, request.query.limit);
        }

        if (history_count.count === 0) {
          return [];
        }


        const query = Object.assign({ id, user_id: request.auth.credentials.id }, request.query);
        query.page = (query.page - 1) * query.limit;

        return this.db.activities.history(query);
      });
    });

    return reply(result);
  },
  validate: {
    params: {
      id: Joi.string().guid()
    },
    query: {
      limit: Joi.number().default(10).min(1).max(100),
      page: Joi.number().default(0).min(0)
    }
  }
};
