let counter = 0;

export function generateId(prefix: string): string {
  counter += 1;
  const time = Date.now().toString(36);
  const count = counter.toString(36);
  const rand = Math.random().toString(36).substring(2, 7);
  return `${prefix}-${time}-${count}-${rand}`;
}
