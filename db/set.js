'use strict';
const BaseModel = require('./base-model');
const BaseCollection = require('./base-collection');
const _ = require('lodash');

module.exports = function Set (bookshelf, BPromise) {

    const baseModel = BaseModel(bookshelf);
    const baseCollection = BaseCollection(bookshelf);
    const Model = baseModel.extend({
        /*
         * t.increments('id').primary();
         * t.integer('activity_id').index().notNullable().references('activities.id');
         * t.boolean('pr').notNullable().defaultTo(false);
         * t.integer('reps');
         * t.integer('weight');
         * t.text('unit');
         * t.integer('distance');
         * t.integer('time');
         */
        hidden: ['activityId', 'createdAt', 'updatedAt'],
        tableName: 'sets',
        activity: function () {

            return this.belongsTo('Activity');
        }
    }, {
        collection: function (models, options) {

            return Collection.forge((models || []), _.extend({}, options));
        }
    });

    const Collection = baseCollection.extend({
        model: Model
    });

    bookshelf.model('Set', Model);
    bookshelf.collection('Sets', Collection);

    return {
        model: Model,
        collection: Collection
    };
};
