var Joi = require('joi');

var controllers = {};

controllers.all = {
    description: 'Get all user activity names',
    tags: ['activityName'],
    handler: function (request, reply) {

        var user = request.auth.credentials.user;

        //TODO pagination
        return reply(user.getActivityNames().then(function (activityNames) {

            return {data: activityNames};
        }));
    }
};

controllers.get = {
    description: 'Get one user activity name by id',
    tags: ['activityName'],
    handler: function (request, reply) {

        var user = request.auth.credentials.user;

        return reply(user.getActivityName(request.params).then(function (activityName) {

            return {data: activityName};
        }));
    },
    validate: {
        params: {
            id: Joi.string().regex(/^[0-9]+$/)
        }
    }
};

module.exports = controllers;
