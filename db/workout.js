'use strict';
const BaseModel = require('./base-model');
const BaseCollection = require('./base-collection');
const _ = require('lodash');

module.exports = function Workout (bookshelf, BPromise) {

    const baseModel = BaseModel(bookshelf);
    const baseCollection = BaseCollection(bookshelf);
    const Model = baseModel.extend({
        /*
         * t.increments('id').primary();
         * t.integer('user_id').index().notNullable().references('users.id');
         * t.text('name').notNullable();
         * t.text('raw').notNullable();
         * t.date('date').notNullable();
         */
        hidden: ['userId', 'createdAt', 'updatedAt'],
        tableName: 'workouts',
        activities: function () {

            return this.hasMany('Activity');
        }
    }, {
        collection: function (models, options) {

            return Collection.forge((models || []), _.extend({}, options));
        }
    });

    const Collection = baseCollection.extend({
        model: Model,
        make: function (attrs) {

            const self = this;
            const workoutAttrs = _.pick(attrs, ['name', 'raw', 'date']);
            const activities = request.params.activities;

            //Check that activities exist first
            return BPromise.map(activities, function (activity) {

                return db.ActivityName.get({ id: activity.activityName.id });
            }).then(function () {

                return Bookshelf.transaction(function (t) {

                    return self.create(workoutAttrs, { transacting: t })
                    .then(function (workout) {

                        return Promise.map(activities, function (activity) {

                            const activityAttrs = Hoek.transform(activity, {
                                activity_id: 'activityName.id',
                                comment: 'comment'
                            });
                            return workout.activities().create(activityAttrs, { transacting: t })
                            .then(function (newActivity) {

                                return newActivity.sets.reset(activity.sets, { transacting: t });
                            });
                        })
                        .then(function () {

                            return workout;
                        });
                    });
                });
            })
            .then(function (workout) {

                return self.get({ id: workout.id }, { withRelated: ['activities', 'activities.activityName', 'activities.sets'] });
            });
        }
    });

    bookshelf.model('Workout', Model);
    bookshelf.collection('Workouts', Collection);

    return {
        model: Model,
        collection: Collection
    };
};
