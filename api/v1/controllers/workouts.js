'use strict';
const Joi = require('joi');

const controllers = {};

module.exports = controllers;

controllers._id = 'date';

controllers.get = {
    description: 'Get full workout for given day',
    tags: ['workout'],
    handler: function (request, reply) {

        const user = request.auth.credentials.user;

        reply(
            user.related('workouts')
            .getOne(request.params, { withRelated: ['activities', 'activities.activityName', 'activities.sets'] })
            .then(function (workout) {

                return { data: workout };
            })
        );
    },
    validate: {
        params: {
            date: Joi.date().format('YYYY-MM-DD').raw().example('2012-09-20')
        }
    }
};

controllers.search = {
    description: 'Search for workout on a given day',
    notes: 'Only returns main workout properties',
    tags: ['workout'],
    handler: function (request, reply) {

        const user = request.auth.credentials.user;

        reply(
            user.related('workouts')
            .getOne(request.params)
            .then(function (workout) {

                return { data: workout };
            })
        );
    },
    validate: {
        params: {
            date: Joi.date().format('YYYY-MM-DD').raw().example('2012-09-20')
        }
    }
};

controllers.create = {
    description: 'Create a new workout',
    tags: ['workout'],
    handler: function (request, reply) {

        const user = request.auth.credentials.user;

        reply(
            user.related('workouts')
            .make(request.params)
            .then(function (workout) {

                return { data: workout };
            })
        ).code(201);
    },
    validate: {
        payload: {
            name: Joi.string().required().example('Front Squat'),
            raw: Joi.string().required(),
            date: Joi.date().required().format('YYYY-MM-DD').raw().example('2012-09-20'),
            activities: Joi.array().items(Joi.object().keys({
                comment: Joi.string(),
                activityName: Joi.object().keys({
                    id: Joi.number().required()
                }).unknown(),
                sets: Joi.array().items(
                    Joi.object().keys({
                        pr: Joi.bool(),
                        reps: Joi.number(),
                        weight: Joi.number(),
                        unit: Joi.string(),
                        distance: Joi.number(),
                        time: Joi.number()
                    })
                ).min(1)
            }).unknown())
        }
    }
};
