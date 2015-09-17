'use strict';
const Boom = require('boom');
const Hoek = require('hoek');

module.exports = function (bookshelf) {

    const Base = bookshelf.Collection.extend({
        serialize: function (options) {

            return this.map(function (model) {

                return model.toJSON(options);
            }).then(function (result) {

                return { data: result };
            });
        },
        getOne: function (attrs, related) {

            attrs = Hoek.shallow(attrs);

            return new this.query({ where: attrs }).fetchOne({ withRelated: related }).then(function (model) {

                if (!model) {
                    //TODO can we infer Model.prototype.type here?
                    throw Boom.notFound('Not found');
                }
                return model;
            });
        }
    });

    return Base;
};
