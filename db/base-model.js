'use strict';
const Boom = require('boom');
const Hoek = require('hoek');
const _ = require('lodash');

module.exports = function (bookshelf) {

    /*
     * knex wants snake_case in the db (created_at et al)
     * we want camelCase
     */
    const Base = bookshelf.Model.extend({
        hasTimestamps: ['createdAt', 'updatedAt'],
        serialize: function (options) {

            let attributes = _(this.attributes).omit('id').clone();
            if (this.booleans) {
                this.booleans.forEach((attr) => {

                    attributes[attr] = Boolean(attributes[attr]);
                });
            }
            if (this.visible) {
                attributes = _.pick.apply(_, [attributes].concat(this.visible));
            }
            if (this.hidden) {
                attributes = _.omit.apply(_, [attributes].concat(this.hidden));
            }
            const result = {
                id: this.attributes[this.idAttribute],
                type: this.type,
                attributes: attributes
            };
            if (options && options.shallow) {
                return result;
            }
            const relations = this.relations;
            if (Object.keys(relations).length > 0) {
                result.relationships = {};
                for (const key in relations) {
                    const relation = relations[key];
                    result.relationships[key] = { data: relation.toJSON ? relation.toJSON(options) : relation };
                }
            }
            if (options && options.omitPivot) {
                return result;
            }
            if (this.pivot) {
                const pivot = this.pivot.attributes;
                for (const key in pivot) {
                    result.attributes['_pivot_' + key] = pivot[key];
                }
            }
            return result;
        },
        format: function (attrs) {

            const formatted = _.reduce(attrs, function (memo, val, key) {

                memo[_.snakeCase(key)] = val;
                return memo;
            }, {});

            return formatted;
        },
        parse: function (attrs) {

            const parsed = _.reduce(attrs, function (memo, val, key) {

                memo[_.camelCase(key)] = val;
                return memo;
            }, {});

            return parsed;
        }
    }, {
        //fetch wrapper that throws Boom.notFound if applicable
        get: function (attrs) {

            attrs = Hoek.shallow(attrs);

            return new this(attrs).fetch().then(function (model) {

                if (!model) {
                    throw Boom.notFound();
                }

                return model;
            });
        }
    });

    return Base;
};
