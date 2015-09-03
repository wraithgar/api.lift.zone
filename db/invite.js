var BaseModel = require('./base-model');
var BaseCollection = require('./base-collection');

module.exports = function (bookshelf, BPromise) {

    var baseModel = BaseModel(bookshelf);
    var baseCollection = BaseCollection(bookshelf);
    var Invite = baseModel.extend({
        /*
         * t.text('code').unique().index();
         * t.integer('user_id').index().notNullable().references('users.id');
         */
        type: 'invite',
        idAttribute: 'code',
        tableName: 'invites'
    });

    var Invites = baseCollection.extend({
        model: Invite
    });

    bookshelf.model('Invite', Invite);
    bookshelf.collection('Invites', Invites);

    return {
        model: Invite,
        collection: Invites
    };
};
