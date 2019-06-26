'use strict';

const Boom = require('boom');
const Joi = require('joi');

module.exports = {
  description: 'Get workout history for an activity by id',
  tags: ['api', 'activity'],
  handler: async function(request) {
    const params = { ...request.params, user_id: request.auth.credentials.id };
    const activity = await this.db.activities.findOne(params);

    if (!activity) {
      throw Boom.notFound();
    }

    let id = activity.id;
    if (activity.activity_id) {
      id = activity.activity_id;
    }

    const history_count = await this.db.activities.history_count({
      id,
      user_id: request.auth.credentials.id
    });

    /* eslint require-atomic-updates: 0 */
    request.totalCount = history_count.count;

    let { page } = request.query;
    if (page === 0) {
      page = this.utils.lastPage(history_count.count, request.query.limit);
    }

    if (history_count.count === 0) {
      return [];
    }

    const query = {
      ...request.query,
      page,
      id,
      user_id: request.auth.credentials.id
    };
    query.page = (query.page - 1) * query.limit;
    const activities = await this.db.activities.history(query);

    return activities;
  },
  validate: {
    params: {
      id: Joi.string().guid()
    },
    query: {
      limit: Joi.number()
        .default(10)
        .min(1)
        .max(100),
      page: Joi.number()
        .default(0)
        .min(0)
    }
  }
};
