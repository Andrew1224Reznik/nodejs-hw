// Імпортуємо пакет для створення HTTP-помилок
import createHttpError from 'http-errors';

// Імпортуємо модель Note з Mongoose
import { Note } from '../models/note.js';

// Отримати всі нотатки
export async function getAllNotes(req, res) {
  const notes = await Note.find(); // Шукаємо всі документи в колекції Note
  res.status(200).json(notes); // Відправляємо результат клієнту
}

// Отримати конкретну нотатку за id
export async function getNoteById(req, res) {
  const noteId = req.params.noteId; // Беремо id з параметрів маршруту
  const note = await Note.findById(noteId); // Шукаємо нотатку за id
  if (!note) {
    // Якщо нотатку не знайдено, кидаємо HTTP-помилку 404
    throw createHttpError(404, 'Note not found');
  }
  res.status(200).json(note); // Відправляємо знайдену нотатку
}

// Створити нову нотатку
export async function createNote(req, res) {
  const note = await Note.create(req.body); // Створюємо новий документ на основі даних з req.body
  res.status(201).json(note); // Відправляємо створену нотатку з кодом 201 (Created)
}

// Видалити нотатку за id
export async function deleteNote(req, res) {
  const noteId = req.params.noteId; // Беремо id з параметрів маршруту
  const note = await Note.findOneAndDelete({ _id: noteId }); // Видаляємо нотатку з бази
  if (!note) {
    // Якщо нотатку не знайдено, кидаємо HTTP-помилку 404
    throw createHttpError(404, 'Note not found');
  }
  res.status(200).json(note); // Відправляємо видалену нотатку
}

// Оновити нотатку за id
export async function updateNote(req, res) {
  const noteId = req.params.noteId; // Беремо id з параметрів маршруту
  const note = await Note.findOneAndUpdate(
    { _id: noteId }, // Умови для пошуку
    req.body, // Дані для оновлення
    { returnDocument: 'after' }, // Повернути оновлений документ
  );
  if (!note) {
    // Якщо нотатку не знайдено, кидаємо HTTP-помилку 404
    throw createHttpError(404, 'Note not found');
  }
  res.status(200).json(note); // Відправляємо оновлену нотатку
}
