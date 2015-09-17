'use strict';
const BaseModel = require('./base-model');
const BaseCollection = require('./base-collection');

module.exports = function ActivityName (bookshelf, BPromise) {

    const baseModel = BaseModel(bookshelf);
    const baseCollection = BaseCollection(bookshelf);
    const Model = baseModel.extend({
        /* t.increments('id').primary();
         * t.integer('user_id').index().notNullable().references('users.id');
         * t.integer('activityname_id').index().references('activitynames.id');
         * t.text('name').notNullable().index();
         */
        type: 'activityName',
        tableName: 'useractivities',
        aliases: function () {

            return this.hasMany(Model);
        },
        aliasFor: function () {

            return this.belongsTo(Model);
        }
    });

    const Collection = baseCollection.extend({
        model: Model
    });

    bookshelf.model('ActivityName', Model);
    bookshelf.collection('ActivityNames', Collection);

    return {
        model: Model,
        collection: Collection
    };
};
