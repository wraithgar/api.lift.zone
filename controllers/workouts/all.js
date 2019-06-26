'use strict';

module.exports = {
  description: "Get a summary of all of a user's workouts",
  tags: ['api', 'workout'],
  handler: async function(request) {
    const result = await this.db.workouts.summary({
      user_id: request.auth.credentials.id
    });

    return result;
  }
};
