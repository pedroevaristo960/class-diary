import type { AppSettings } from '../../shared/types.js';
import type { SettingsRepository } from '../database/repositories/SettingsRepository.js';
import { logger } from '../logger.js';

export class SettingsService {
  private settingsRepo: SettingsRepository;
  constructor(settingsRepo: SettingsRepository) {
    this.settingsRepo = settingsRepo;
  }

  getAllSettings(): AppSettings {
    return this.settingsRepo.getAll();
  }

  getSetting(key: string): string | null {
    if (!key) return null;
    return this.settingsRepo.get(key);
  }

  setSetting(key: string, value: string): void {
    if (!key) throw new Error('Chave de configuração é obrigatória.');
    this.settingsRepo.set(key, value);
    logger.info('Setting updated', { key, value });
  }

  updateSettings(settings: Record<string, string>): AppSettings {
    this.settingsRepo.setMultiple(settings);
    logger.info('Multiple settings updated', { keys: Object.keys(settings) });
    return this.settingsRepo.getAll();
  }
}
