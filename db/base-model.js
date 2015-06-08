var Boom = require('boom');
var Hoek = require('hoek');
var _ = require('lodash');

module.exports = function (bookshelf) {

    /*
     * knex wants snake_case in the db (created_at et al)
     * we want camelCase
     */
    var Base = bookshelf.Model.extend({
        hasTimestamps: ['createdAt', 'updatedAt'],
        serialize: function (options) {

            var key;
            var attributes = _(this.attributes).omit('id').clone();
            if (this.visible) {
                attributes = _.pick.apply(_, [attributes].concat(this.visible));
            }
            if (this.hidden) {
                attributes = _.omit.apply(_, [attributes].concat(this.hidden));
            }
            var result = {
                id: this.attributes[this.idAttribute],
                type: this.type,
                attributes: attributes
            };
            if (options && options.shallow) {
                return result;
            }
            var relations = this.relations;
            if (Object.keys(relations).length > 0) {
                result.relationships = {};
                for (key in relations) {
                    var relation = relations[key];
                    result.relationships[key] = { data: relation.toJSON ? relation.toJSON(options) : relation };
                }
            }
            if (options && options.omitPivot) {
                return result;
            }
            if (this.pivot) {
                var pivot = this.pivot.attributes;
                for (key in pivot) {
                    result.attributes['_pivot_' + key] = pivot[key];
                }
            }
            return result;
        },
        format: function (attrs) {

            var formatted = _.reduce(attrs, function (memo, val, key) {

                memo[_.snakeCase(key)] = val;
                return memo;
            }, {});

            return formatted;
        },
        parse: function (attrs) {

            var parsed = _.reduce(attrs, function (memo, val, key) {

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
