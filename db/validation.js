'use strict';
const BaseModel = require('./base-model');
const _ = require('lodash');
const Utils = require('../utils');

module.exports = function Validation (bookshelf, BPromise) {

    const baseModel = BaseModel(bookshelf);
    const Model = baseModel.extend({
        /*
         * t.integer('user_id').index().notNullable().references('users.id');
         * t.text('code').notNullable().index();
         */
        idAttribute: 'code',
        tableName: 'validations',
        recent: function () {
            //Recent is w/in the last 15 minutes

            return this.query('where', 'created', '>', bookshelf.knex.raw('datetime("now", "-15 minutes")')).fetch();
        },
        current: function () {
            //Current is w/in the last week

            return this.query('where', 'created', '>', bookshelf.knex.raw('datetime("now", "-7 days")')).fetch();
        },
        make: function () {
            //Create a new one if there isn't a recent one

            const self = this;

            return self.recent()
            .then(function (recentValidation) {

                if (recentValidation) {
                    return null;
                }

                //Create new validation and send email

                //Ughhhhhhh thanks for nothing knex
                return bookshelf.knex.raw('replace into validations (user_id, code, created_at, updated_at) values (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)', [this.relatedData.parentId, Utils.generateValidationCode()])
                .then(function () {

                    return self.fetch();
                });
            });
        }
    }, {
        collection: function (models, options) {

            return Collection.forge((models || []), _.extend({}, options));
        }
    });

    bookshelf.model('Validation', Model);

    return {
        model: Model
    };
};
