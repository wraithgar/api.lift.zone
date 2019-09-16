'use strict';

const Joi = require('@hapi/joi').extend(require('@hapi/joi-date'));

//Calculate last page of a set based on a count and page size
exports.lastPage = (count, pageSize) => {
  const last = Math.ceil(count / pageSize);

  return last || 1;
};

exports.workoutValidator = Joi.object({
  id: Joi.string()
    .guid()
    .strip(),
  name: Joi.string().required(),
  date: Joi.date()
    .format('YYYY-MM-DD')
    .raw(),
  raw_date: Joi.string()
    .allow(null)
    .default(null),
  raw: Joi.string().required(),
  visible: Joi.boolean().allow(null),
  activities: Joi.array().items(
    Joi.object({
      id: Joi.string()
        .guid()
        .required(),
      activity_id: Joi.string()
        .guid()
        .allow(null),
      name: Joi.string(),
      alias: Joi.string().allow(null),
      comment: Joi.string(),
      sets: Joi.array().items(
        Joi.object()
          .keys({
            pr: Joi.boolean(),
            reps: Joi.number(),
            weight: Joi.number(),
            unit: Joi.string().allow('miles', 'kilometers', 'kg', 'lb'),
            time: Joi.number(),
            distance: Joi.number()
          })
          .nand('weight', 'time')
          .with('weight', ['reps', 'unit'])
          .with('distance', 'unit')
          .xor('reps', 'time')
      ),
      suggestions: Joi.any().strip()
    })
  )
});
