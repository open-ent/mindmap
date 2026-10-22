import { describe, expect, it } from 'vitest';

import { DEFAULT_MAP, escapeXml } from './index';

describe('carte initiale', () => {
  it('échappe les caractères réservés du XML', () => {
    expect(escapeXml(`Maths & Sciences <3 "L'idée"`)).toBe('Maths &amp; Sciences &lt;3 &quot;L&apos;idée&quot;');
  });
  it('produit un XML valide pour un nom piégé', () => {
    const xml = DEFAULT_MAP(`L'"idée" & <b>`);
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    expect(doc.querySelector('parsererror')).toBeNull();
    expect(doc.querySelector('topic')?.getAttribute('text')).toBe(`L'"idée" & <b>`);
  });
  it('un nom sans caractère réservé reste identique', () => {
    expect(DEFAULT_MAP('Histoire')).toContain('text="Histoire"');
  });
});
