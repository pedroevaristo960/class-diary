import type { OccurrenceRecord, CreateOccurrenceDTO } from '../../shared/types.js';
import type { DisciplineRepository } from '../database/repositories/DisciplineRepository.js';
import { logger } from '../logger.js';

export class DisciplineService {
  private disciplineRepo: DisciplineRepository;
  constructor(disciplineRepo: DisciplineRepository) {
    this.disciplineRepo = disciplineRepo;
  }

  getAllOccurrences(): OccurrenceRecord[] {
    return this.disciplineRepo.findAll();
  }

  getOccurrencesByClass(classId: string): OccurrenceRecord[] {
    if (!classId) throw new Error('ID da turma é obrigatório.');
    return this.disciplineRepo.findByClassId(classId);
  }

  getOccurrencesByStudent(studentId: string): OccurrenceRecord[] {
    if (!studentId) throw new Error('ID do aluno é obrigatório.');
    return this.disciplineRepo.findByStudentId(studentId);
  }

  addOccurrence(data: CreateOccurrenceDTO): OccurrenceRecord {
    if (!data.classId) throw new Error('ID da turma é obrigatório.');
    if (!data.studentId) throw new Error('ID do aluno é obrigatório.');
    if (!data.date) throw new Error('Data é obrigatória.');
    if (!data.reason) throw new Error('Motivo da ocorrência é obrigatório.');

    const id = `occ_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const timestamp = data.timestamp || new Date().toISOString();

    const created = this.disciplineRepo.create(id, data, timestamp);
    logger.info('Disciplinary occurrence recorded', { id: created.id, studentId: created.studentId, reason: created.reason });
    return created;
  }

  deleteOccurrence(id: string): boolean {
    if (!id) throw new Error('ID da ocorrência é obrigatório.');
    this.disciplineRepo.delete(id);
    logger.info('Disciplinary occurrence deleted', { id });
    return true;
  }
}
