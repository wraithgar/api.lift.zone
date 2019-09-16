'use strict';

const Boom = require('@hapi/boom');

module.exports = {
  description: 'Promote an activity to main activity',
  tags: ['api', 'activity'],
  handler: async function(request) {
    const activity = await this.db.activities.findOne({
      id: request.params.id,
      user_id: request.auth.credentials.id
    });

    if (!activity) {
      throw Boom.notFound();
    }

    await this.db.tx(async tx => {
      // Set any current aliases to us
      await tx.activities.update(
        { activity_id: activity.activity_id },
        { activity_id: activity.id }
      );

      await Promise.all([
        // Set our activity_id to null
        tx.activities.updateOne({ id: activity.id }, { activity_id: null }),
        // Set old parent's activity_id to us
        tx.activities.updateOne(
          { id: activity.activity_id },
          { activity_id: activity.id }
        )
      ]);
    });

    const activities = await this.db.activities.with_aliases({
      id: request.params.id,
      user_id: request.auth.credentials.id
    });

    return activities;
  }
};
