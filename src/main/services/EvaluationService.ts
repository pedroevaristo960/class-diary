import type { EvaluationItem, SaveEvaluationDTO } from '../../shared/types.js';
import type { EvaluationRepository } from '../database/repositories/EvaluationRepository.js';
import { logger } from '../logger.js';

export class EvaluationService {
  private evalRepo: EvaluationRepository;
  constructor(evalRepo: EvaluationRepository) {
    this.evalRepo = evalRepo;
  }

  getAllEvaluations(): EvaluationItem[] {
    return this.evalRepo.findAll();
  }

  getEvaluationsByClass(classId: string): EvaluationItem[] {
    if (!classId) throw new Error('ID da turma é obrigatório.');
    return this.evalRepo.findByClassId(classId);
  }

  getEvaluationById(id: string): EvaluationItem {
    if (!id) throw new Error('ID da avaliação é obrigatório.');
    const ev = this.evalRepo.findById(id);
    if (!ev) throw new Error(`Avaliação '${id}' não encontrada.`);
    return ev;
  }

  saveEvaluation(data: SaveEvaluationDTO): EvaluationItem {
    if (!data.classId) throw new Error('ID da turma é obrigatório.');
    if (!data.title || data.title.trim() === '') throw new Error('Título da avaliação é obrigatório.');
    if (data.maxScore === undefined || data.maxScore <= 0) {
      throw new Error('A pontuação máxima deve ser superior a zero.');
    }

    const id = data.id || `eval_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const saved = this.evalRepo.saveEvaluation(id, data, now);
    logger.info('Evaluation saved', {
      id: saved.id,
      title: saved.title,
      classId: saved.classId,
      scoresCount: Object.keys(saved.scores).length,
    });
    return saved;
  }

  deleteEvaluation(id: string): boolean {
    if (!id) throw new Error('ID da avaliação é obrigatório.');
    this.evalRepo.delete(id);
    logger.info('Evaluation deleted', { id });
    return true;
  }
}
