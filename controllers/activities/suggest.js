'use strict';

const Joi = require('joi');

module.exports = {
  description: 'Search activities by name',
  tags: ['api', 'activity'],
  handler: function (request, reply) {

    const user_id = request.auth.credentials.id;

    const result = this.db.activities.search_alias({ user_id, name: request.params.name }).then((activity) => {

      if (activity) {
        return activity;
      }

      const name = request.params.name.replace(/\s+/g, ' | ').toLowerCase();
      return this.db.activities.search({ name, user_id: request.auth.credentials.id }).then((suggestions) => {

        return { suggestions };
      });
    });

    return reply(result);
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
