'use strict';

const Joi = require('joi');

module.exports = {
  description: 'Search activities by name',
  tags: ['activity'],
  handler: function (request, reply) {

    //select ts_headline('Squat', to_tsquery('barbell | squat'));
    const name = request.params.name.replace(/\s+/g, ' | ').toLowerCase();

    const result =  this.db.activities.search({ name, user_id: request.auth.credentials.id });

    return reply(result);
  },
  validate: {
    params: {
      name: Joi.string().example('Front Squat')
    }
  }
};
