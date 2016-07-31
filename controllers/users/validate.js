'use strict';

module.exports = {
  description: 'Request email validation',
  tags: ['user'],
  handler: function (request, reply) {

    const result = this.db.validations.fresh({ user_id: request.auth.credentials.id }).then((existingValidation) => {

      if (existingValidation) {
        return null;
      }

      return this.db.validations.insert({ user_id: request.auth.credentials.id }).then(() => {

        return null;
      });
    });
    return reply(result).code(202);
  }
};

