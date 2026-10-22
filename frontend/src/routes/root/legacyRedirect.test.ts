import { describe, expect, it } from 'vitest';

import { legacyRedirect } from './legacyRedirect';

describe('anciens liens du médiacentre de cartes', () => {
  it('consultation, impression (page et image), dossier', () => {
    expect(legacyRedirect('/view/42')).toBe('/id/42');
    expect(legacyRedirect('/print/42')).toBe('/print/id/42');
    expect(legacyRedirect('/print/png/42')).toBe('/print/id/42');
    expect(legacyRedirect('/folder/7')).toBe('/');
  });
  it('un chemin actuel ou inconnu n’est pas redirigé', () => {
    expect(legacyRedirect('/id/42')).toBeNull();
    expect(legacyRedirect('/autre')).toBeNull();
  });
});
