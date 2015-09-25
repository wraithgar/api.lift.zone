'use strict';
const Joi = require('joi');

const controllers = {};

module.exports = controllers;

controllers.all = {
    description: 'Get all user activity names',
    tags: ['userActivity'],
    handler: function (request, reply) {

        const user = request.auth.credentials.user;
        const db = this.db;

        //TODO filter based on request.query.filter
        return reply(user.related('activityNames').fetch()
        .then(function (activityNames) {

            return { data: activityNames };
        }));
    }
};

controllers.suggest = {
    description: 'Suggest alternative user activity names',
    notes: 'Returns match if exact match found',
    tags: ['userActivity'],
    handler: function (request, reply) {

        const user = request.auth.credentials.user;
        const db = this.db;

        return reply(user.related('activityNames').query(function () {

            this.where(request.params);
        }).fetchOne()
        .then(function (existing) {

            if (existing) {
                return existing;
            }

            const newActivityName = db.ActivityName.forge(request.params);
            return user.related('activityNames').suggestions(request.params)
            .then(function (suggestions) {

                //Hack but whatever
                newActivityName.relations.suggestions = suggestions;
                return newActivityName;
            });
        }).then(function (activityName) {

            return { data: activityName };
        }));
    },
    validate: {
        params: {
            name: Joi.string().example('Front Squat')
        }
    }
};

controllers.get = {
    description: 'Get one user activity name by id',
    tags: ['userActivity'],
    handler: function (request, reply) {

        const user = request.auth.credentials.user;

        return reply(user.related('activityNames').getOne(request.params, { withRelated: ['aliases', 'aliasFor'] }).then(function (userActivity) {

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

        return reply(user.related('activityNames').make(request.payload.data.attributes).then(function (userActivity) {

            return { data: userActivity };
        })).code(201);
    },
    validate: {
        payload: {
            data: {
                type: Joi.string().valid('activityName').required(),
                attributes: Joi.object().keys({
                    name: Joi.string().required().example('Front Squat'),
                    useractivityId: Joi.number().description('Id of the activity name this is an alias for')
                })
            }
        }
    }
};
