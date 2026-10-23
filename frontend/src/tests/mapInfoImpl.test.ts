import { describe, expect, it, vi } from 'vitest';

// Le contrat `MapInfo` vient de l'éditeur ; seul le type est utilisé, la classe n'en dépend pas à l'exécution.
vi.mock('@edifice-wisemapping/editor', () => ({}));

import MapInfoImpl from '~/features/mindmap/MapInfoImpl';

describe('MapInfoImpl', () => {
  it('setTitle enregistre le titre sans lever d’exception', () => {
    const info = new MapInfoImpl('12', 'Ancien titre', false);
    expect(() => info.setTitle('Nouveau titre')).not.toThrow();
    expect(info.getTitle()).toBe('Nouveau titre');
  });
  it('expose l’identifiant et l’état verrouillé', () => {
    const info = new MapInfoImpl('12', 'T', true);
    expect(info.isLocked()).toBe(true);
    expect(info.getId()).toBe('12');
  });
});
