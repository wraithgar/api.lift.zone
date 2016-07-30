'use strict';
const Joi = require('joi');

const controllers = {};

module.exports = controllers;

controllers._id = 'id';

controllers.all = {
    description: 'Get all activity names',
    tags: ['activityName'],
    handler: function (request, reply) {

        const user = request.auth.credentials.user;

        reply(
            user.related('activityNames')
            .fetch()
            .then(function (activityNames) {

                return { data: activityNames };
            })
        );
    }
};

controllers.suggest = {
    description: 'Suggest alternative activity names',
    notes: 'Returns match if exact match found',
    tags: ['activityName'],
    handler: function (request, reply) {

        const user = request.auth.credentials.user;
        const db = this.db;

        reply(
            user.related('activityNames')
            .query({ where: request.params })
            .fetchOne()
            .then(function (existing) {

                if (existing) { return existing; }

                const newActivityName = db.ActivityName.forge(request.params);

                return user.related('activityNames').suggestions(request.params)
                .then(function (suggestions) {

                    newActivityName.relations.suggestions = suggestions;
                    return newActivityName;
                });
            })
            .then(function (activityName) {

                return { data: activityName };
            })
        );
    },
    validate: {
        params: {
            name: Joi.string().example('Front Squat')
        }
    }
};

controllers.get = {
    description: 'Get one activity name by id',
    tags: ['activityName'],
    handler: function (request, reply) {

        const user = request.auth.credentials.user;

        reply(
            user.related('activityNames')
            .getOne(request.params, { withRelated: ['aliases', 'aliasOf'] })
            .then(function (activityName) {

                return { data: activityName };
            })
        );
    },
    validate: {
        params: {
            id: Joi.number()
        }
    }
};

controllers.create = {
    description: 'Create an activity name',
    tags: ['activityName'],
    handler: function (request, reply) {

        const user = request.auth.credentials.user;

        reply(
            user.related('activityNames')
            .make(request.payload)
            .then(function (activityName) {

                return { data: activityName };
            })
        ).code(201);
    },
    validate: {
        payload: {
            name: Joi.string().required().example('Front Squat'),
            aliasId: Joi.number().description('Optional id of the activity name this is an alias of')
        }
    }
};
