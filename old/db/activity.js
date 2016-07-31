'use strict';
const BaseModel = require('./base-model');
const BaseCollection = require('./base-collection');
const _ = require('lodash');

module.exports = function Activity (bookshelf, BPromise) {

    const baseModel = BaseModel(bookshelf);
    const baseCollection = BaseCollection(bookshelf);
    const Model = baseModel.extend({
        /*
         * t.increments('id').primary();
         * t.integer('workout_id').index().notNullable().references('workouts.id');
         * t.integer('useractivity_id').index().notNullable().references('useractivities.id');
         * t.text('comment');
         * t.unique(['workout_id', 'useractivity_id']);
         */
        hidden: ['workoutId', 'useractivityId', 'createdAt', 'updatedAt'],
        tableName: 'activities',
        workout: function () {

            return this.belongsTo('Workout');
        },
        activityName: function () {

            return this.belongsTo('ActivityName');
        },
        sets: function () {

            return this.hasMany('Set');
        }
    }, {
        collection: function (models, options) {

            return Collection.forge((models || []), _.extend({}, options));
        }
    });

    const Collection = baseCollection.extend({
        model: Model
    });

    bookshelf.model('Activity', Model);
    bookshelf.collection('Activities', Collection);

    return {
        model: Model,
        collection: Collection
    };
};

