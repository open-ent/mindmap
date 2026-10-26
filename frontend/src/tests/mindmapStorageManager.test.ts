import { afterEach, describe, expect, it, vi } from 'vitest';

// L'éditeur est un gros paquet navigateur : seul le contrat de `PersistenceManager` compte ici.
vi.mock('@edifice-wisemapping/editor', () => ({ PersistenceManager: class {} }));
vi.mock('~/services/api', () => ({ updateMindmap: vi.fn() }));

import MindmapStorageManager, {
  SAVE_ERROR_EVENT,
} from '~/features/mindmap/MindmapStorageManager';
import { updateMindmap } from '~/services/api';

const doc = () => new DOMParser().parseFromString('<map/>', 'text/xml');
const flush = () => new Promise((r) => setTimeout(r, 0));

describe('MindmapStorageManager.saveMapXml', () => {
  afterEach(() => vi.clearAllMocks());

  it('enregistrement réussi : l’éditeur est prévenu (l’indicateur « Enregistrement… » s’efface)', async () => {
    vi.mocked(updateMindmap).mockResolvedValue({});
    const events = { onSuccess: vi.fn(), onError: vi.fn() };
    const onSaveError = vi.fn();
    globalThis.addEventListener(SAVE_ERROR_EVENT, onSaveError);

    new MindmapStorageManager('/mindmap/1', 'Carte').saveMapXml('1', doc(), {}, false, events);
    await flush();

    expect(events.onSuccess).toHaveBeenCalledTimes(1);
    expect(events.onError).not.toHaveBeenCalled();
    expect(onSaveError).not.toHaveBeenCalled();
    globalThis.removeEventListener(SAVE_ERROR_EVENT, onSaveError);
  });

  it('enregistrement refusé : erreur transmise à l’éditeur avec le message traduit, alerte intégrée demandée', async () => {
    vi.mocked(updateMindmap).mockRejectedValue(new Error('500'));
    const events = { onSuccess: vi.fn(), onError: vi.fn() };
    const onSaveError = vi.fn();
    globalThis.addEventListener(SAVE_ERROR_EVENT, onSaveError);

    new MindmapStorageManager('/mindmap/1', 'Carte', 'La sauvegarde a échoué').saveMapXml('1', doc(), {}, false, events);
    await flush();

    expect(events.onSuccess).not.toHaveBeenCalled();
    expect(events.onError).toHaveBeenCalledWith({ severity: 'SEVERE', message: 'La sauvegarde a échoué', errorType: 'generic' });
    expect(onSaveError).toHaveBeenCalledTimes(1);
    globalThis.removeEventListener(SAVE_ERROR_EVENT, onSaveError);
  });

  it('sans objet d’événements (appel hors éditeur) : aucune exception', async () => {
    vi.mocked(updateMindmap).mockResolvedValue({});
    expect(() => new MindmapStorageManager('/mindmap/1', 'Carte').saveMapXml('1', doc())).not.toThrow();
    await flush();
  });

  it('une erreur levée par onSuccess ne passe pas pour un échec d’enregistrement', async () => {
    vi.mocked(updateMindmap).mockResolvedValue({});
    const events = { onSuccess: vi.fn(() => { throw new Error('affichage'); }), onError: vi.fn() };
    const onSaveError = vi.fn();
    globalThis.addEventListener(SAVE_ERROR_EVENT, onSaveError);
    const erreur = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    new MindmapStorageManager('/mindmap/1', 'Carte').saveMapXml('1', doc(), {}, false, events);
    await flush();
    expect(erreur).toHaveBeenCalledTimes(1);
    erreur.mockRestore();
    expect(events.onError).not.toHaveBeenCalled();
    expect(onSaveError).not.toHaveBeenCalled();
    globalThis.removeEventListener(SAVE_ERROR_EVENT, onSaveError);
  });
});
