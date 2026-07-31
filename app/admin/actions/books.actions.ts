'use server';
import { verifyAuth } from '@/lib/auth/verify';
import { BookService } from '@/lib/services/book.service';
import { bookSchema } from '@/lib/schemas';

const bookService = new BookService();

export async function getBooks() {
  await verifyAuth();
  return await bookService.getAll();
}

export async function getBookById(id: string) {
  await verifyAuth();
  return await bookService.getById(id);
}

export async function createBook(data: any) {
  await verifyAuth();
  const validData = bookSchema.parse(data);
  return await bookService.create(validData as any);
}

export async function updateBook(id: string, data: any) {
  await verifyAuth();
  const validData = bookSchema.parse(data);
  return await bookService.update(id, validData as any);
}

export async function deleteBook(id: string) {
  await verifyAuth();
  return await bookService.delete(id);
}

export async function hideBook(id: string) {
  await verifyAuth();
  return await bookService.hide(id);
}

export async function unhideBook(id: string) {
  await verifyAuth();
  return await bookService.unhide(id);
}

export async function featureBook(id: string) {
  await verifyAuth();
  return await bookService.feature(id);
}

export async function unfeatureBook(id: string) {
  await verifyAuth();
  return await bookService.unfeature(id);
}