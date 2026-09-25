import { migrator } from './migrator.js';
import { migration001 } from './001_initial_schema.js';
import { migration002 } from './002_initial_seed.js';

export function setupMigrations(): void {
  migrator.register(migration001);
  migrator.register(migration002);
}

export { migrator };
