var baseModel = require('./base-model');
var utils = require('../utils');

module.exports = function (bookshelf, BPromise) {

    var BaseModel = baseModel(bookshelf);
    var Validation = BaseModel.extend({
        /*
         * t.integer('user_id').index().notNullable().references('users.id');
         * t.text('code').notNullable().index();
         */
        type: 'validation',
        idAttribute: 'code',
        tableName: 'validations',
        recent: function () {
            //Recent is w/in the last 15 minutes

            return this.query('where', 'created', '>', bookshelf.knex.raw('datetime("now", "-15 minutes")')).fetch();
        },
        current: function () {
            //Current is w/in the last week

            return this.query('where', 'created', '>', bookshelf.knex.raw('datetime("now", "-7 days")')).fetch();
        }
    });

    bookshelf.model('Validation', Validation);

    return {
        model: Validation
    };
};
