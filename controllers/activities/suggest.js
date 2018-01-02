'use strict';

const Joi = require('joi');

module.exports = {
  description: 'Search activities by name',
  tags: ['api', 'activity'],
  handler: async function (request, h) {

    const user_id = request.auth.credentials.id;

    const activity = await this.db.activities.search_alias({ user_id, name: request.params.name });

    if (activity) {
      return activity;
    }

    const name = request.params.name.replace(/\s+/g, ' | ').toLowerCase();
    const suggestions = await this.db.activities.search({ name, user_id: request.auth.credentials.id });

    return { suggestions };
  },
  validate: {
    params: {
      name: Joi.string().replace(/[^\w' ]/gi, '')
    }
  },
  response: {
    modify: true,
    schema: Joi.object({
      user_id: Joi.any().strip()
    }).unknown()
  }
};
