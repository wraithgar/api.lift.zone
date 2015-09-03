
module.exports = function (bookshelf) {

    var Base = bookshelf.Collection.extend({
        serialize: function (options) {

            return this.map(function (model) {

                return model.toJSON(options);
            }).then(function (result) {

                return { data: result };
            });
        }
    });

    return Base;
};
