'use strict';

module.exports = {
  description: 'Log the current user out and invalidate all of their tokens',
  tags: ['api', 'user'],
  handler: function (request, reply) {

    const result = this.db.users.updateOne({ id: request.auth.credentials.id }, { logout: new Date() }).then((user) => {

      return request.generateResponse().code(204);
    });

    return reply(result);
  }
};
