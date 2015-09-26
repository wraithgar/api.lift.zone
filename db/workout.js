'use strict';
const BaseModel = require('./base-model');
const BaseCollection = require('./base-collection');

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
        hidden: ['userId'],
        activities: function () {

            return this.hasMany('Activity');
        }
    }, {
        collection: function (models, options) {

            return Collection.forge((models || []), _.extend({}, options));
        }
    });

    const Collection = baseCollection.extend({
        model: Model
    });

    bookshelf.model('Workout', Model);
    bookshelf.collection('Workouts', Collection);

    return {
        model: Model,
        collection: Collection
    };
};
