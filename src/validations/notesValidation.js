import { Joi, Segments } from 'celebrate';
import { isValidObjectId } from 'mongoose';
import { TAGS } from '../constants/tag.js';

//Схема для валідації запиту на отримання всіх нотаток з пагінацією, фільтрацією за тегом та пошуком
export const getAllNotesSchema = {
  [Segments.QUERY]: Joi.object({
    page: Joi.number().integer().min(1).default(1).messages({
      'number.base': 'Page must be a number',
      'number.min': 'Page must be at least {#limit}',
    }),
    perPage: Joi.number().integer().min(5).max(20).default(10).messages({
      'number.base': 'PerPage must be a number',
      'number.min': 'PerPage must be at least {#limit}',
      'number.max': 'PerPage must be at most {#limit}',
    }),
    tag: Joi.string()
      .valid(...TAGS)
      .optional()
      .messages({
        'string.base': 'Tag must be a string',
        'any.only': `Tag must be one of: ${TAGS}`,
      }),
    search: Joi.string().trim().allow('').optional().messages({
      'string.base': 'Search must be a string',
    }),
  }),
};

//Кастомний валідатор для ObjectId
const objectIdValidator = (value, helpers) => {
  return isValidObjectId(value) ? helpers.message('Invalid id format') : value;
};

//Схема для валідації параметра noteId
export const noteIdSchema = {
  [Segments.PARAMS]: Joi.object({
    noteId: Joi.string().custom(objectIdValidator).required(),
  }),
};

//Схема для валідації тіла запиту при створенні нотатки
export const createNoteSchema = {
  [Segments.BODY]: Joi.object({
    title: Joi.string().min(1).required().messages({
      'string.base': 'Title must be a string',
      'string.min': 'Title should have at lest {#limit} character',
      'any.required': 'Title is required',
    }),
    content: Joi.string().trim().allow('').messages({
      'string.base': 'Content must be a string',
    }),
    tag: Joi.string()
      .valid(...TAGS)
      .optional()
      .messages({
        'string.base': 'Tag must be a string',
        'any.only': `Tag must be one of: ${TAGS}`,
      }),
  }),
};

export const updateNoteSchema = {
  [Segments.PARAMS]: Joi.object({
    studentId: Joi.string().custom(objectIdValidator).required(),
  }),
  [Segments.BODY]: Joi.object({
    title: Joi.string().min(1).messages({
      'string.base': 'Title must be a string',
      'string.min': 'Title should have at lest {#limit} character',
    }),
    content: Joi.string().trim().allow('').messages({
      'string.base': 'Content must be a string',
    }),
    tag: Joi.string()
      .valid(...TAGS)
      .optional()
      .messages({
        'string.base': 'Tag must be a string',
        'any.only': `Tag must be one of: ${TAGS}`,
      }),
  }).min(1),
};
