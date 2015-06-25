var baseModel = require('./base-model');
var baseCollection = require('./base-collection');

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
        tableName: 'invites'
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
