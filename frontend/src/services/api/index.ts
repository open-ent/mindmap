import { odeServices } from '@open-ent/client';

import { MindmapProps } from '~/models/mindmap';

export type UpdateMindmapProps = Pick<MindmapProps, 'name' | 'map'>;

export const getMindmap = async (url: string): Promise<MindmapProps> => {
  return await odeServices.http().get(url);
};

/**
 * updateMindmap API
 * @param url
 * @param mindmapBody name and current map
 */
export const updateMindmap = async (
  url: string,
  mindmapBody: UpdateMindmapProps,
) => {
  const result = await odeServices.http().putJson(url, mindmapBody);
  // Le client du socle ne lève pas sur erreur : sans ce contrôle, un 403/500
  // passait pour une sauvegarde réussie (ex. carte perdue après un 500).
  if (odeServices.http().isResponseError()) {
    throw new Error(odeServices.http().latestResponse?.statusText || 'save-error');
  }
  return result;
};
