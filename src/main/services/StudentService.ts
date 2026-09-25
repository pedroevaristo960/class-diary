import type { Student, CreateStudentDTO, CreateStudentBatchDTO } from '../../shared/types.js';
import type { StudentRepository } from '../database/repositories/StudentRepository.js';
import { logger } from '../logger.js';

export class StudentService {
  private studentRepo: StudentRepository;
  constructor(studentRepo: StudentRepository) {
    this.studentRepo = studentRepo;
  }

  getAllStudents(): Student[] {
    return this.studentRepo.findAll();
  }

  getStudentsByClass(classId: string): Student[] {
    if (!classId) throw new Error('ID da turma é obrigatório.');
    return this.studentRepo.findByClassId(classId);
  }

  getStudentById(id: string): Student {
    if (!id) throw new Error('ID do aluno é obrigatório.');
    const student = this.studentRepo.findById(id);
    if (!student) {
      throw new Error(`Aluno com ID '${id}' não encontrado.`);
    }
    return student;
  }

  addStudent(data: CreateStudentDTO): Student {
    if (!data.classId) throw new Error('ID da turma é obrigatório.');
    if (!data.name || data.name.trim() === '') {
      throw new Error('O nome do aluno é obrigatório.');
    }

    const currentStudents = this.studentRepo.findByClassId(data.classId);
    let number = data.number;
    if (number === undefined || number === null) {
      const maxNumber = currentStudents.reduce((max, s) => (s.number ? Math.max(max, s.number) : max), 0);
      number = maxNumber + 1;
    }

    const id = `std_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = new Date().toISOString();

    const created = this.studentRepo.create(
      id,
      {
        classId: data.classId,
        name: data.name.trim(),
        number,
        active: data.active ?? true,
      },
      createdAt
    );

    logger.info('Student added', { id: created.id, name: created.name, classId: data.classId });
    return created;
  }

  addMultipleStudents(data: CreateStudentBatchDTO): Student[] {
    if (!data.classId) throw new Error('ID da turma é obrigatório.');
    if (!data.names || data.names.length === 0) return [];

    const validNames = data.names
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    if (validNames.length === 0) return [];

    const currentStudents = this.studentRepo.findByClassId(data.classId);
    let nextNumber = currentStudents.reduce((max, s) => (s.number ? Math.max(max, s.number) : max), 0) + 1;

    const now = new Date().toISOString();
    const studentsToInsert = validNames.map((name, idx) => ({
      id: `std_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      classId: data.classId,
      name,
      number: nextNumber++,
      active: true,
      createdAt: now,
    }));

    const result = this.studentRepo.createBatch(studentsToInsert);
    logger.info('Batch students added', { classId: data.classId, count: result.length });
    return result;
  }

  updateStudent(id: string, data: Partial<CreateStudentDTO>): Student {
    if (!id) throw new Error('ID do aluno é obrigatório.');
    const updated = this.studentRepo.update(id, data);
    if (!updated) {
      throw new Error(`Aluno com ID '${id}' não encontrado para atualização.`);
    }
    logger.info('Student updated', { id });
    return updated;
  }

  deleteStudent(id: string): boolean {
    if (!id) throw new Error('ID do aluno é obrigatório.');
    this.studentRepo.delete(id);
    logger.info('Student deleted', { id });
    return true;
  }
}
