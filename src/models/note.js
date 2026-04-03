import { Schema, model } from 'mongoose';
import 'dotenv/config';
import { TAGS } from '../constants/tags.js';

const noteSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: false,
      default: '',
      trim: true,
    },
    tag: {
      type: String,
      required: false,
      enum: TAGS,
      default: 'Todo',
    },
    userId: {
      // Додаємо поле userId для зберігання посилання на користувача, який створив нотатку
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true, // Додаємо автоматичне створення полів createdAt та updatedAt для відстеження часу створення та оновлення документів
    versionKey: false, // Вимикаємо автоматичне додавання поля __v для версійності документів
  },
);

noteSchema.index(
  { title: 'text', content: 'text' },
  {
    name: 'NotesTextIndex',
    weights: { title: 5, content: 2 },
    default_language: 'english',
  },
);

export const Note = model('Note', noteSchema);
