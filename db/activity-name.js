var baseModel = require('./base-model');
var baseCollection = require('./base-collection');

module.exports = function (bookshelf, BPromise) {

    var BaseModel = baseModel(bookshelf);
    var BaseCollection = baseCollection(bookshelf);
    var ActivityName = BaseModel.extend({
        /* t.increments('id').primary();
         * t.integer('user_id').index().notNullable().references('users.id');
         * t.integer('activityname_id').index().references('activitynames.id');
         * t.text('name').notNullable().index();
         */
        type: 'activityName',
        tableName: 'useractivities',
        aliases: function () {

            return this.hasMany(ActivityName);
        }
    });

    var ActivityNames = BaseCollection.extend({
        model: ActivityName
    });

    bookshelf.model('ActivityName', ActivityName);
    bookshelf.collection('ActivityNames', ActivityNames);

    return {
        model: ActivityName,
        collection: ActivityNames
    };
};
