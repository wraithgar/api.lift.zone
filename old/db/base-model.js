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

            const attributes = bookshelf.Model.prototype.serialize.apply(this, arguments);
            if (this.booleans) {
                this.booleans.forEach((attr) => {

                    attributes[attr] = Boolean(attributes[attr]);
                });
            }
            return attributes;
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
        get: function (attrs, fetchParams) {

            attrs = Hoek.shallow(attrs);

            return new this(attrs).fetch(fetchParams).then(function (model) {

                if (!model) {
                    throw Boom.notFound();
                }

                return model;
            });
        }
    });

    return Base;
};
