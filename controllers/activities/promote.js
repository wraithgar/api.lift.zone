'use strict';

const Boom = require('boom');

module.exports = {
  description: 'Promote an activity to main activity',
  tags: ['activity'],
  handler: function (request, reply) {

    const result = this.db.activities.findOne({ id: request.params.id, user_id: request.auth.credentials.id }).then((activity) => {

      if (!activity) {
        throw Boom.notFound();
      }
      return this.db.tx((tx) => {

        // Set any current aliases to us
        return tx.activities.update({ activity_id: activity.activity_id }, { activity_id: activity.id }).then(() => {

          return Promise.all([
            // Set our activity_id to null
            tx.activities.updateOne({ id: activity.id }, { activity_id: null }),
            // Set old parent's activity_id to us
            tx.activities.updateOne({ id: activity.activity_id }, { activity_id: activity.id })
          ]);
        });
      });
    }).then(() => {

      return this.db.activities.with_aliases({ id: request.params.id, user_id: request.auth.credentials.id });
    });

    return reply(result);
  }
};
