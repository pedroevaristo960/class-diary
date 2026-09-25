import type { AttendanceSession, SaveAttendanceDTO } from '../../shared/types.js';
import type { AttendanceRepository } from '../database/repositories/AttendanceRepository.js';
import { logger } from '../logger.js';

export class AttendanceService {
  private attendanceRepo: AttendanceRepository;
  constructor(attendanceRepo: AttendanceRepository) {
    this.attendanceRepo = attendanceRepo;
  }

  getAllAttendances(): AttendanceSession[] {
    return this.attendanceRepo.findAll();
  }

  getAttendancesByClass(classId: string): AttendanceSession[] {
    if (!classId) throw new Error('ID da turma é obrigatório.');
    return this.attendanceRepo.findByClassId(classId);
  }

  getAttendanceByDate(classId: string, date: string): AttendanceSession | null {
    if (!classId || !date) throw new Error('ID da turma e data são obrigatórios.');
    return this.attendanceRepo.findByClassAndDate(classId, date);
  }

  saveAttendance(data: SaveAttendanceDTO): AttendanceSession {
    if (!data.classId) throw new Error('ID da turma é obrigatório.');
    if (!data.date) throw new Error('Data da chamada é obrigatória.');

    const id = data.id || `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const saved = this.attendanceRepo.saveSession(id, data, now);
    logger.info('Attendance session saved', {
      id: saved.id,
      classId: saved.classId,
      date: saved.date,
      recordCount: Object.keys(saved.records).length,
    });
    return saved;
  }

  deleteAttendance(id: string): boolean {
    if (!id) throw new Error('ID da sessão de presença é obrigatório.');
    this.attendanceRepo.delete(id);
    logger.info('Attendance session deleted', { id });
    return true;
  }
}
