import { describe, expect, it } from 'vitest';
import { browserLocale, resolveLocale, setStrings, t } from '../src/systems/I18n';
import type { LocalesManifest } from '../src/types/corpus';

const manifest: LocalesManifest = {
  default: 'es',
  locales: { es: { name: 'Español', levels: ['level_01', 'level_02'] }, en: { name: 'English', levels: ['level_01'] } },
};

describe('I18n', () => {
  it('t reads nested keys and fills placeholders', () => {
    setStrings({ reader: { page: 'pág. {n} de {m}' }, closed: { title: 'REGISTRO CERRADO' } });
    expect(t('reader.page', { n: 1, m: 3 })).toBe('pág. 1 de 3');
    expect(t('closed.title')).toBe('REGISTRO CERRADO');
    expect(t('missing.key')).toBe('missing.key');
  });

  it('resolveLocale falls back to the default when the locale lacks the level', () => {
    expect(resolveLocale(manifest, 'en', 'level_01')).toBe('en');
    expect(resolveLocale(manifest, 'en', 'level_02')).toBe('es');
    expect(resolveLocale(manifest, 'es', 'level_02')).toBe('es');
  });

  it('browserLocale picks a supported language or the default', () => {
    expect(browserLocale(manifest, 'en-US')).toBe('en');
    expect(browserLocale(manifest, 'es-AR')).toBe('es');
    expect(browserLocale(manifest, 'fr-FR')).toBe('es');
    expect(browserLocale(manifest, undefined)).toBe('es');
  });
});
