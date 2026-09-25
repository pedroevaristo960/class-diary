import type { ParticipationRecord, CreateParticipationDTO } from '../../shared/types.js';
import type { ParticipationRepository } from '../database/repositories/ParticipationRepository.js';
import { logger } from '../logger.js';

export class ParticipationService {
  private partRepo: ParticipationRepository;
  constructor(partRepo: ParticipationRepository) {
    this.partRepo = partRepo;
  }

  getAllParticipations(): ParticipationRecord[] {
    return this.partRepo.findAll();
  }

  getParticipationsByClass(classId: string): ParticipationRecord[] {
    if (!classId) throw new Error('ID da turma é obrigatório.');
    return this.partRepo.findByClassId(classId);
  }

  getParticipationsByStudent(studentId: string): ParticipationRecord[] {
    if (!studentId) throw new Error('ID do aluno é obrigatório.');
    return this.partRepo.findByStudentId(studentId);
  }

  addParticipation(data: CreateParticipationDTO): ParticipationRecord {
    if (!data.classId) throw new Error('ID da turma é obrigatório.');
    if (!data.studentId) throw new Error('ID do aluno é obrigatório.');
    if (!data.date) throw new Error('Data é obrigatória.');
    if (!data.type || !['positive', 'negative'].includes(data.type)) {
      throw new Error('Tipo de participação deve ser positivo ou negativo.');
    }

    const id = `part_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const timestamp = data.timestamp || new Date().toISOString();

    const created = this.partRepo.create(id, data, timestamp);
    logger.info('Participation recorded', { id: created.id, studentId: created.studentId, type: created.type });
    return created;
  }

  deleteParticipation(id: string): boolean {
    if (!id) throw new Error('ID do registo de participação é obrigatório.');
    this.partRepo.delete(id);
    logger.info('Participation deleted', { id });
    return true;
  }
}
