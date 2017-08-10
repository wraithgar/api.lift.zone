'use strict';

module.exports = {
  description: 'Log the current user out and invalidate all of their tokens',
  tags: ['api', 'user'],
  handler: async function (request, reply) {

    await this.db.users.updateOne({ id: request.auth.credentials.id }, { logout: new Date() });

    return reply().code(204);
  }
};
