// @ts-ignore
import { PersistenceManager } from '@edifice-wisemapping/editor';
import { DEFAULT_MAP } from '~/config';

import { updateMindmap } from '~/services/api';

/** Événement émis quand la sauvegarde échoue (écouté par l'écran pour afficher un message). */
export const SAVE_ERROR_EVENT = 'mindmap:save-error';

class MindmapStorageManager extends PersistenceManager {
  private documentUrl: string;
  private mapName: string;
  private errorMessage: string;

  constructor(documentUrl: string, mapName: string, errorMessage = 'Save failed') {
    super();
    this.documentUrl = documentUrl;
    this.mapName = mapName;
    this.errorMessage = errorMessage;
  }

  /**
   * L'éditeur affiche « Enregistrement… » puis attend que le gestionnaire appelle `events.onSuccess()` ou
   * `events.onError()` : sans cet appel l'indicateur ne s'efface jamais, même quand l'enregistrement a réussi.
   */
  saveMapXml(
    _mapId: string,
    mapDoc: Document,
    _pref?: unknown,
    _saveHistory?: boolean,
    events?: {
      onSuccess?: () => void;
      onError?: (error: { severity: string; message: string; errorType?: string }) => void;
    },
  ): void {
    const mapXml = new XMLSerializer().serializeToString(mapDoc);

    const body = {
      name: this.mapName,
      map: mapXml,
    };

    // `then(succès, échec)` et non `then().catch()` : une erreur levée par `onSuccess` ne doit pas passer pour un échec.
    updateMindmap(this.documentUrl, body).then(
      () => {
        try {
          events?.onSuccess?.();
        } catch (error) {
          // L'enregistrement a réussi : un défaut d'affichage de l'éditeur ne doit pas être présenté comme un échec.
          console.error(error);
        }
      },
      () => {
        events?.onError?.({
          severity: 'SEVERE',
          message: this.errorMessage,
          errorType: 'generic',
        });
        globalThis.dispatchEvent(new CustomEvent(SAVE_ERROR_EVENT));
      },
    );
  }

  loadMapDom(): Promise<Document> {
    const result: Promise<Document> = fetch(this.documentUrl, {
      method: 'GET',
    })
      .then((response: Response) => {
        if (!response.ok) {
          console.error(`Response: ${response.status}`);
          throw new Error(
            `Response: ${response.status}, ${response.statusText}`,
          );
        }
        return response.json();
      })
      .then((data) => {
        return data.map ? data.map : DEFAULT_MAP(data?.name);
      })
      .then((xmlStr) => new DOMParser().parseFromString(xmlStr, 'text/xml'));

    return result;
  }
}

export default MindmapStorageManager;
