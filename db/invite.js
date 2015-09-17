'use strict';
const BaseModel = require('./base-model');
const BaseCollection = require('./base-collection');

module.exports = function Invite (bookshelf, BPromise) {

    const baseModel = BaseModel(bookshelf);
    const baseCollection = BaseCollection(bookshelf);
    const Model = baseModel.extend({
        /*
         * t.text('code').unique().index();
         * t.integer('user_id').index().notNullable().references('users.id');
         */
        type: 'invite',
        idAttribute: 'code',
        tableName: 'invites'
    });

    const Collection = baseCollection.extend({
        model: Model
    });

    bookshelf.model('Invite', Model);
    bookshelf.collection('Invites', Collection);

    return {
        model: Model,
        collection: Collection
    };
};
