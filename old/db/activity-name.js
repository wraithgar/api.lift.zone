'use strict';
const Boom = require('boom');
const Hoek = require('hoek');
const _ = require('lodash');

const BaseCollection = require('./base-collection');
const BaseModel = require('./base-model');

module.exports = function ActivityName (bookshelf, BPromise) {

    const baseModel = BaseModel(bookshelf);
    const baseCollection = BaseCollection(bookshelf);
    const Model = baseModel.extend({
        /* t.increments('id').primary();
         * t.integer('user_id').index().notNullable().references('users.id');
         * t.integer('activityname_id').index().references('activitynames.id');
         * t.text('name').notNullable().index();
         */
        hidden: ['userId', 'useractivityId', 'createdAt', 'updatedAt'],
        tableName: 'useractivities',
        aliases: function () {

            return this.hasMany('ActivityName');
        },
        aliasOf: function () {

            return this.belongsTo(Model);
        }
    }, {
        collection: function (models, options) {

            return Collection.forge((models || []), _.extend({}, options));
        }
    });

    const Suggestion = Model.extend({
        type: 'activitySuggestion'
    });

    const Collection = baseCollection.extend({
        model: Model,
        suggestions: function (attrs) {

            const self = this;
            const names = attrs.name.toLowerCase().replace(/[^a-z\s]/, '').split(/\s+/).join(' OR ');

            return self.query(function (qb) {

                this.join('activitynames', { 'activitynames.docid': 'useractivities.id' });
                this.andWhere(bookshelf.knex.raw('activitynames MATCH ?', names));
            }).fetch({ withRelated: ['aliases'] });
        },
        make: function (attrs) {

            const self = this;
            const mapped = Hoek.transform(attrs, {
                name: 'name',
                useractivityId: 'aliasId'
            });

            return BPromise.resolve().then(function () {

                if (mapped.useractivityId === undefined) {
                    return;
                }
                return self.query({ where: { id: mapped.useractivityId } }).fetchOne().then(function (alias) {

                    if (!alias) {
                        throw Boom.notFound('Alias not found');
                    }
                });
            }).then(function () {

                return self.create(mapped);
            }).then(function (activityName) {

                activityName.related('aliases'); //Guaranteed to be empty
                return activityName.related('aliasOf')
                .fetch()
                .then(function () {

                    return activityName;
                });
            });
        }
    });

    const SuggestionCollection = Collection.extend({
        model: Suggestion
    });

    bookshelf.model('ActivityName', Model);
    bookshelf.collection('ActivityNames', Collection);

    return {
        model: Model,
        collection: Collection
    };
};
