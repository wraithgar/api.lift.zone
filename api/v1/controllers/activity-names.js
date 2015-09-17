'use strict';
const Joi = require('joi');

const controllers = {};

module.exports = controllers;

controllers.all = {
    description: 'Get all user activity names',
    tags: ['userActivity'],
    handler: function (request, reply) {

        const user = request.auth.credentials.user;

        //TODO pagination
        return reply(user.related('activityNames').fetch().then(function (activityNames) {

            return { data: activityNames };
        }));
    }
};

controllers.suggest = {
    description: 'Suggest an activity name based on given name',
    notes: 'Attempts to do a fulltext search',
    tags: ['userActivity'],
    handler: function (request, reply ) {

        const user = request.auth.credentials.user;

        return reply(user.related('activityNames').suggest(request.payload).then(function (activityNames) {

            return { data: activityNames };
        }));
    },
    validate: {
        payload: {
            name: Joi.string().required().example('Front Squat')
        }
    }

};
controllers.search = {
    description: 'Search for an existing activity name',
    notes: 'Exact name matches only, returns main activity in the event of a matched alias',
    tags: ['userActivity'],
    handler: function (request, reply) {

        const user = request.auth.credentials.user;

        return reply(user.related('activityNames').getOne(request.params, { withRelated: ['aliases'] }).then(function (activityNames) {

            return { data: activityNames };
        }));
    },
    validate: {
        payload: {
            name: Joi.string().required().example('Front Squat')
        }
    }
};

controllers.get = {
    description: 'Get one user activity name by id',
    tags: ['userActivity'],
    handler: function (request, reply) {

        const user = request.auth.credentials.user;

        return reply(user.related('activityNames').getOne(request.params, { withRelated: ['aliases'] }).then(function (userActivity) {

            return { data: userActivity };
        }));
    },
    validate: {
        params: {
            id: Joi.number()
        }
    }
};

controllers.create = {
    description: 'Create a user activity',
    tags: ['userActivity'],
    handler: function (request, reply) {

        const user = request.auth.credentials.user;

        return reply(user.related('activityNames').make(request.payload).then(function (userActivity) {

            return { data: userActivity };
        })).code(201);
    },
    validate: {
        payload: {
            name: Joi.string().required().example('Front Squat'),
            useractivityId: Joi.number().description('Id of the activity name this is an alias for')
        }
    }
};
