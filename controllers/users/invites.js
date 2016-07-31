'use strict';

module.exports = {
  description: 'Invites for currently logged in user',
  tags: ['user'],
  handler: function (request, reply) {

    if (!request.auth.credentials.validated) {
      return reply([]);
    }

    const result = this.db.invites.find({ user_id: request.auth.credentials.id });

    return reply(result);
  }
};
