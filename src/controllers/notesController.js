// Імпортуємо пакет для створення HTTP-помилок
import createHttpError from 'http-errors';

// Імпортуємо модель Note з Mongoose
import { Note } from '../models/note.js';

// Отримати всі нотатки
export async function getAllNotes(req, res) {
  //Отримуємо параметри пагінації і задаємо дефолтні значення
  const { page = 1, perPage = 10, tag, search } = req.query;
  const skip = (page - 1) * perPage; // Обчислюємо кількість документів для пропуску

  // Створюємо базовий запит для колекції
  const notesQuery = Note.find({ userId: req.user._id }); // Фільтруємо нотатки за userId, щоб отримати лише нотатки поточного користувача

  if (tag) {
    notesQuery.where('tag').equals(tag); // Додаємо фільтрацію за тегом, якщо він вказаний
  }
  if (search) {
    notesQuery.where({ $text: { $search: search } }); // Додаємо текстовий пошук, якщо параметр search не порожній
  }

  // Виконуємо одразу два запити паралельно
  const [totalNotes, notes] = await Promise.all([
    notesQuery.clone().countDocuments(), // Підрахунок загальної кількості нотаток
    notesQuery.skip(skip).limit(perPage),
  ]); // Отримання нотаток з пагінацією

  //Обчислюємо загальну кількість "сторінок" для пагінації
  const totalPages = Math.ceil(totalNotes / perPage);

  // Відправляємо відповідь з нотатками та інформацією про пагінацію
  res.status(200).json({
    page,
    perPage,
    totalNotes,
    totalPages,
    notes,
  });
}

// Отримати конкретну нотатку за id
export async function getNoteById(req, res) {
  const noteId = req.params.noteId; // Беремо id з параметрів маршруту
  const note = await Note.findOne({ _id: noteId, userId: req.user._id }); // Нам потрібно знайти конкретний документ за двома умовами: _id студента і userId власника.
  if (!note) {
    // Якщо нотатку не знайдено, кидаємо HTTP-помилку 404
    throw createHttpError(404, 'Note not found');
  }
  res.status(200).json(note); // Відправляємо знайдену нотатку
}

// Створити нову нотатку
export async function createNote(req, res) {
  const note = await Note.create({ ...req.body, userId: req.user._id }); // Створюємо новий документ на основі даних з req.body
  res.status(201).json(note); // Відправляємо створену нотатку з кодом 201 (Created)
}

// Видалити нотатку за id
export async function deleteNote(req, res) {
  const noteId = req.params.noteId; // Беремо id з параметрів маршруту
  const note = await Note.findOneAndDelete({
    _id: noteId,
    userId: req.user._id,
  }); // Видаляємо нотатку з бази
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
    { _id: noteId, userId: req.user._id }, // Умови для пошуку
    req.body, // Дані для оновлення
    { returnDocument: 'after' }, // Повернути оновлений документ
  );
  if (!note) {
    // Якщо нотатку не знайдено, кидаємо HTTP-помилку 404
    throw createHttpError(404, 'Note not found');
  }
  res.status(200).json(note); // Відправляємо оновлену нотатку
}
