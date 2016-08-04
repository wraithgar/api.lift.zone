'use strict';

const Joi = require('joi');

module.exports = {
  description: 'Search activities by name',
  tags: ['activity'],
  handler: function (request, reply) {

    const user_id = request.auth.credentials.id;
    const result = this.db.activities.findOne({ user_id, name: request.params.name }).then((activity) => {

      if (activity) {
        return activity;
      }
      //select ts_headline('Squat', to_tsquery('barbell | squat'));
      const name = request.params.name.replace(/\s+/g, ' | ').toLowerCase();
      return this.db.activities.search({ name, user_id: request.auth.credentials.id }).then((suggestions) => {

        return { suggestions };
      });
    });

    return reply(result);
  },
  validate: {
    params: {
      name: Joi.string().example('Front Squat')
    }
  },
  response: {
    modify: true,
    schema: Joi.object({
      user_id: Joi.any().strip()
    }).unknown()
  }
};
