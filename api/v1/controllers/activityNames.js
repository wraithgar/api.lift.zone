var Joi = require('joi');

var controllers = {};

controllers.all = {
    description: 'Get all user activity names',
    tags: ['userActivity'],
    handler: function (request, reply) {

        var user = request.auth.credentials.user;

        //TODO pagination
        return reply(user.getActivities());
    }
};
controllers.get = {
    description: 'Get one user activity name by id',
    tags: ['userActivity'],
    handler: function (request, reply) {

        var user = request.auth.credentials.user;

        return reply(user.getActivity(request.params).then(function (userActivity) {

            return {data: userActivity};
        }));
    },
    validate: {
        params: {
            id: Joi.string().regex(/^[0-9]+$/)
        }
    }
};

module.exports = controllers;
