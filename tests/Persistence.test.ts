import { describe, expect, it } from 'vitest';
import { GameState } from '../src/systems/GameState';
import { KEY, deserialize, load, save, serialize } from '../src/systems/Persistence';

const fakeStorage = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), m };
};

describe('Persistence', () => {
  it('saves and restores what persists, and only that', () => {
    const s = new GameState();
    s.enterLevel('level_01');
    s.collectNote({ id: 'n', kind: 'correction', paper: 'p', text: 't' });
    s.archiveDeath('level_01', 'recuerdo_2024.md', 'time');
    s.addMemory({ levelId: 'level_01', factId: 'f1', text: 'x', state: 'recovered' });
    s.closeLevel('level_01');

    const storage = fakeStorage();
    save(s.toPersistent(), storage);
    const read = load(storage)!;
    expect(read.archive).toEqual([{ levelId: 'level_01', file: 'recuerdo_2024.md', type: 'time' }]);
    expect(read.memories).toHaveLength(1);
    expect(read.closedLevels).toEqual(['level_01']);
    expect(JSON.stringify(read)).not.toMatch(/"notes"/);
  });

  it('ignores a save from another version or a broken one', () => {
    expect(deserialize(JSON.stringify({ version: 0, currentLevel: 'level_01' }))).toBeNull();
    expect(deserialize('{not json')).toBeNull();
    expect(deserialize(null)).toBeNull();
  });

  it('fills missing options with defaults', () => {
    const p = deserialize(JSON.stringify({ version: 1, currentLevel: 'level_03', options: { highContrast: true } }))!;
    expect(p.options).toMatchObject({ highContrast: true, nonPixelFont: false, textSize: 1, locale: 'es' });
    expect(p.closedLevels).toEqual([]);
  });

  it('uses the versioned key', () => {
    const storage = fakeStorage();
    save(new GameState().toPersistent(), storage);
    expect([...storage.m.keys()]).toEqual([KEY]);
    expect(serialize(new GameState().toPersistent())).toMatch(/"version":1/);
  });

  it('does not break without storage', () => {
    expect(() => save(new GameState().toPersistent(), null)).not.toThrow();
    expect(load(null)).toBeNull();
  });
});

describe('GameState.retry', () => {
  it('keeps the box as it was and only clears the amendments', () => {
    const s = new GameState();
    s.enterLevel('level_01');
    s.collectNote({ id: 'n', kind: 'correction', paper: 'p', text: 't' });
    s.storeBelonging({ id: 'mug', name: 'La taza', text: 't' });
    s.documentCollected = true;
    s.amendments.set('f5', { factId: 'f5', operation: 'strike' });
    s.retry();
    expect(s.notes).toHaveLength(1);
    expect(s.belongings).toHaveLength(1);
    expect(s.documentCollected).toBe(true);
    expect(s.amendments.size).toBe(0);
  });

  it('entering a level afresh empties the box', () => {
    const s = new GameState();
    s.enterLevel('level_01');
    s.collectNote({ id: 'n', kind: 'correction', paper: 'p', text: 't' });
    s.enterLevel('level_01');
    expect(s.notes).toHaveLength(0);
  });
});
