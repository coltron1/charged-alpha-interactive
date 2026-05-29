export interface SeededRng {
  next: () => number;
  integer: (min: number, max: number) => number;
  pick: <T>(items: T[]) => T;
  shuffle: <T>(items: T[]) => T[];
}

function hashSeed(input: string): number {
  let hash = 1779033703 ^ input.length;

  for (let index = 0; index < input.length; index += 1) {
    hash = Math.imul(hash ^ input.charCodeAt(index), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }

  return hash >>> 0;
}

export function createRng(seed: string): SeededRng {
  let state = hashSeed(seed) || 1;

  const next = () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };

  const integer = (min: number, max: number) =>
    Math.floor(next() * (max - min + 1)) + min;

  const pick = <T,>(items: T[]) => items[integer(0, items.length - 1)];

  const shuffle = <T,>(items: T[]) => {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = integer(0, index);
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
  };

  return { next, integer, pick, shuffle };
}

export function seededShuffle<T>(items: T[], seed: string): T[] {
  return createRng(seed).shuffle(items);
}

export function seededPick<T>(items: T[], seed: string): T {
  return createRng(seed).pick(items);
}
