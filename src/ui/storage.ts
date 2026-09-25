import type { AppData } from './types.js';
import { apiClient } from './api/client.js';

const STORAGE_KEY = 'class_diary_data_v1';

export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading fallback cache:', err);
  }
  return {
    classes: [],
    students: [],
    attendances: [],
    evaluations: [],
    participations: [],
    occurrences: [],
    settings: {},
  };
}

export async function loadAppDataAsync(): Promise<AppData> {
  try {
    const data = await apiClient.getAllData();
    if (data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.error('Error loading from SQLite storage:', err);
  }
  return loadAppData();
}

export function saveAppData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}
