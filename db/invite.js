var baseModel = require('./base-model');
var baseCollection = require('./base-collection');
var utils = require('../utils');

module.exports = function (bookshelf, BPromise) {

    var BaseModel = baseModel(bookshelf);
    var BaseCollection = baseCollection(bookshelf);
    var Invite = BaseModel.extend({
        /*
         * t.text('code').unique().index();
         * t.integer('user_id').index().notNullable().references('users.id');
         */
        type: 'invite',
        idAttribute: 'code',
        tableName: 'invites',
        user: function () {

            return this.belongsTo('User');
        }
    });

    var Invites = BaseCollection.extend({
        model: Invite
    });

    bookshelf.model('Invite', Invite);
    bookshelf.collection('Invites', Invites);

    return {
        model: Invite,
        collection: Invites
    };
};
