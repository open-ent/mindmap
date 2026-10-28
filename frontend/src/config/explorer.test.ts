import { explorerConfig } from './explorer';

describe('explorerConfig', () => {
  it("n'offre « Copier » qu'avec le droit de gestion, comme le serveur", () => {
    const copy = explorerConfig.actions?.find((a) => a.id === 'copy');
    expect(copy?.right).toBe('manager');
  });
});
