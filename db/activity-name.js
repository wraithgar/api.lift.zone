var BaseModel = require('./base-model');
var BaseCollection = require('./base-collection');

module.exports = function (bookshelf, BPromise) {

    var baseModel = BaseModel(bookshelf);
    var baseCollection = BaseCollection(bookshelf);
    var ActivityName = baseModel.extend({
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

    var ActivityNames = baseCollection.extend({
        model: ActivityName
    });

    bookshelf.model('ActivityName', ActivityName);
    bookshelf.collection('ActivityNames', ActivityNames);

    return {
        model: ActivityName,
        collection: ActivityNames
    };
};
