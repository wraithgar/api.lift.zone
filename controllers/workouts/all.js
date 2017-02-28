'use strict';

module.exports = {
  description: 'Get a summary of all of a user\'s workouts',
  tags: ['api', 'workout'],
  handler: function (request, reply) {

    const result = this.db.workouts.summary({ user_id: request.auth.credentials.id });

    return reply(result);
  }
};
