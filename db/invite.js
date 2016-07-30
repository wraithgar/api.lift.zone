'use strict';
const BaseModel = require('./base-model');
const BaseCollection = require('./base-collection');
const Boom = require('boom');
const _ = require('lodash');
const Hoek = require('hoek');
const Utils = require('../utils');

module.exports = function Invite (bookshelf, BPromise) {

    const baseModel = BaseModel(bookshelf);
    const baseCollection = BaseCollection(bookshelf);
    const Model = baseModel.extend({
        /*
         * t.text('code').unique().index();
         * t.integer('user_id').index().notNullable().references('users.id');
         */
        hidden: ['userId', 'createdAt', 'updatedAt'],
        idAttribute: 'code',
        tableName: 'invites'
    }, {
        collection: function (models, options) {

            return Collection.forge((models || []), _.extend({}, options));
        }
    });

    const Collection = baseCollection.extend({
        model: Model,
        generate: function (options) {

            const code = Utils.generateInviteCode();
            options = Hoek.applyToDefaults({ method: 'insert' }, options);

            return this.create({ code: code }, options);
        }
    });

    bookshelf.model('Invite', Model);
    bookshelf.collection('Invites', Collection);

    return {
        model: Model,
        collection: Collection
    };
};
