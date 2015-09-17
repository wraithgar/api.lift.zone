'use strict';
const Boom = require('boom');
const Hoek = require('hoek');
const Promise = require('bluebird');

module.exports = function (bookshelf) {

    const Base = bookshelf.Collection.extend({
        serialize: function (options) {

            return this.map(function (model) {

                return model.toJSON(options);
            });
        },
        getOne: function (attrs, fetchParams) {

            return this.query({ where: Hoek.shallow(attrs) }).fetchOne(fetchParams).then(function (model) {

                if (!model) {
                    throw Boom.notFound();
                }
                return model;
            });
        }
    });

    return Base;
};
