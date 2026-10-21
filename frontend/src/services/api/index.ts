import { odeServices } from '@open-ent/client';

import { MindmapProps } from '~/models/mindmap';

export type UpdateMindmapProps = Pick<MindmapProps, 'name' | 'map'>;

export const getMindmap = async (url: string): Promise<MindmapProps> => {
  return await odeServices.http().get(url);
};

/**
 * sessionHasWorkflowRights API
 * @param url
 * @param mindmap body with name and current map
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

/**
 * sessionHasWorkflowRights API
 * @param actionRights
 * @returns check if user has rights
 */
export const sessionHasWorkflowRights = async (actionRights: string[]) => {
  return await odeServices.rights().sessionHasWorkflowRights(actionRights);
};

/**
 * hasResourceRight API
 * @param actionRights
 * @returns check if user has rights
 */
/* export const hasResourceRight = async () => {
  return await odeServices.rights().hasResourceRight();
}; */
