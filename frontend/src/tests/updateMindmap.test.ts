import { describe, expect, it, vi } from 'vitest';

const http = {
  putJson: vi.fn(),
  isResponseError: vi.fn(),
  latestResponse: { statusText: 'Internal Server Error' },
};
vi.mock('@open-ent/client', () => ({ odeServices: { http: () => http } }));

import { updateMindmap } from '~/services/api';

describe('updateMindmap', () => {
  it('renvoie la réponse quand la sauvegarde réussit', async () => {
    http.putJson.mockResolvedValue({ ok: true });
    http.isResponseError.mockReturnValue(false);
    await expect(updateMindmap('/mindmap/1', { name: 'a', map: '<map/>' })).resolves.toEqual({ ok: true });
  });

  it('lève quand le serveur répond en erreur (ex. 500 sur la sauvegarde)', async () => {
    http.putJson.mockResolvedValue({ error: 'x' });
    http.isResponseError.mockReturnValue(true);
    await expect(updateMindmap('/mindmap/1', { name: 'a', map: '<map/>' })).rejects.toThrow('Internal Server Error');
  });
});
