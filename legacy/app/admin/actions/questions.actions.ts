'use server';
import { verifyAuth } from '@/lib/auth/verify';
import { QuestionService } from '@/lib/services/question.service';
import { questionSchema } from '@/lib/schemas';

const questionService = new QuestionService();

export async function getQuestions() {
  await verifyAuth();
  return await questionService.getAll();
}

export async function getQuestionById(id: string) {
  await verifyAuth();
  return await questionService.getById(id);
}

export async function createQuestion(data: any) {
  await verifyAuth();
  const validData = questionSchema.parse(data);
  return await questionService.create(validData as any);
}

export async function updateQuestion(id: string, data: any) {
  await verifyAuth();
  const validData = questionSchema.parse(data);
  return await questionService.update(id, validData as any);
}

export async function deleteQuestion(id: string) {
  await verifyAuth();
  return await questionService.delete(id);
}

export async function hideQuestion(id: string) {
  await verifyAuth();
  return await questionService.hide(id);
}

export async function unhideQuestion(id: string) {
  await verifyAuth();
  return await questionService.unhide(id);
}


export async function moveQuestionUp(id: string) {
  await verifyAuth();
  return await questionService.moveUp(id);
}

export async function moveQuestionDown(id: string) {
  await verifyAuth();
  return await questionService.moveDown(id);
}


export async function reorderQuestions(ids: string[]) {
  await verifyAuth();
  return await questionService.reorder(ids);
}