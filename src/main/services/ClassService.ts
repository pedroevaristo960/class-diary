import type { Classroom, CreateClassDTO, UpdateClassDTO } from '../../shared/types.js';
import type { ClassRepository } from '../database/repositories/ClassRepository.js';
import { logger } from '../logger.js';

export class ClassService {
  private classRepo: ClassRepository;
  constructor(classRepo: ClassRepository) {
    this.classRepo = classRepo;
  }

  getAllClasses(): Classroom[] {
    return this.classRepo.findAll();
  }

  getClassById(id: string): Classroom {
    if (!id || id.trim() === '') {
      throw new Error('ID da turma é obrigatório.');
    }
    const cls = this.classRepo.findById(id);
    if (!cls) {
      throw new Error(`Turma com ID '${id}' não foi encontrada.`);
    }
    return cls;
  }

  createClass(data: CreateClassDTO): Classroom {
    if (!data.name || data.name.trim() === '') {
      throw new Error('O nome da turma é obrigatório.');
    }
    if (!data.course || data.course.trim() === '') {
      throw new Error('A disciplina/curso da turma é obrigatório.');
    }
    if (!data.grade || data.grade.trim() === '') {
      throw new Error('O ano/classe da turma é obrigatório.');
    }
    if (!data.period || !['Manhã', 'Tarde', 'Noite'].includes(data.period)) {
      throw new Error('O período deve ser Manhã, Tarde ou Noite.');
    }

    const id = `class_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = new Date().toISOString();

    const created = this.classRepo.create(
      id,
      {
        name: data.name.trim(),
        course: data.course.trim(),
        grade: data.grade.trim(),
        period: data.period,
      },
      createdAt
    );

    logger.info('Class created', { id: created.id, name: created.name });
    return created;
  }

  updateClass(id: string, data: UpdateClassDTO): Classroom {
    if (!id) throw new Error('ID da turma é obrigatório.');
    const updated = this.classRepo.update(id, data);
    if (!updated) {
      throw new Error(`Turma com ID '${id}' não foi encontrada para atualização.`);
    }
    logger.info('Class updated', { id });
    return updated;
  }

  deleteClass(id: string): boolean {
    if (!id) throw new Error('ID da turma é obrigatório.');
    this.classRepo.delete(id);
    logger.info('Class deleted', { id });
    return true;
  }
}
