'use strict';
const BaseModel = require('./base-model');
const BaseCollection = require('./base-collection');
const _ = require('lodash');

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
    }, {
        collection: function (models, options) {

            return Collection.forge((models || []), _.extend({}, options));
        }
    });

    const Collection = baseCollection.extend({
        model: Model,
        suggest: function (attrs) {

            const names = attrs.name.toLowerCase().replace(/[^a-z\s]/, '').split(/\s+/).join(' OR ');

            return this.query(function (qb) {

                this.join('activitynames', { 'activitynames.docid': 'useractivities.id' });
                this.andWhere(bookshelf.knex.raw('activitynames MATCH ?', names));
            }).fetch({ withRelated: ['aliases'] });
        },
        make: BPromise.method(function (attrs) {

            const self = this;

            return BPromise.resolve().then(function () {

                if (attrs.alias_id === undefined) {
                    return;
                }
                return self.query({ where: { id: attrs.alias_id } }).fetchOne().then(function (alias) {

                    if (!alias) {
                        throw Boom.notFound('Alias not found');
                    }
                });
            }).then(function () {

                return self.create(attrs);
            }).then(function (activityName) {

                return activityName.fetch({ withRelated: ['aliases'] });
            });
        })
    });

    bookshelf.model('ActivityName', Model);
    bookshelf.collection('ActivityNames', Collection);

    return {
        model: Model,
        collection: Collection
    };
};
