import { Suspense, useEffect, useState } from 'react';

import {
  AppHeader,
  Alert,
  Breadcrumb,
  Button,
  LoadingScreen,
  Tooltip,
  checkUserRight,
  useEdificeClient,
  useTrashedResource,
} from '@open-ent/react';
import { IconRedo, IconUndo } from '@open-ent/react/icons';
// @ts-ignore
import Editor, { useEditor } from '@edifice-wisemapping/editor';
import { IWebApp, odeServices } from '@open-ent/client';
import { useTranslation } from 'react-i18next';
import { LoaderFunctionArgs, useLoaderData, useParams } from 'react-router-dom';

import { DEFAULT_MAP } from '~/config';
import ExportModal from '~/features/export-modal';
import { mapInfo, persistenceManager } from '~/features/mindmap/configuration';
import { SAVE_ERROR_EVENT } from '~/features/mindmap/MindmapStorageManager';
import { useAccessStore } from '~/hooks/useAccessStore';
import { MindmapProps } from '~/models/mindmap';
import { getMindmap } from '~/services/api';
import { useUserRightsStore } from '~/store';

export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;
  const data = await getMindmap(`/mindmap/${id}`);

  if (odeServices.http().isResponseError()) {
    throw new Response('', {
      status: odeServices.http().latestResponse.status,
      statusText: odeServices.http().latestResponse.statusText,
    });
  }

  const userRights = await checkUserRight(data.rights);
  const { setUserRights } = useUserRightsStore.getState();
  setUserRights(userRights);

  return data.map
    ? data
    : {
        ...data,
        map: DEFAULT_MAP(data?.name),
      };
}

export const Mindmap = () => {
  const data = useLoaderData() as MindmapProps;
  const params = useParams();

  const [openModal, setOpenModal] = useState<boolean>(false);

  const { appCode, currentApp, currentLanguage } = useEdificeClient();
  const { canUpdate, canExport } = useAccessStore();
  const { t } = useTranslation();

  const [saveFailed, setSaveFailed] = useState(false);

  useTrashedResource(params?.id);

  const editor = useEditor({
    mapInfo: mapInfo(data?.name, data?.name),
    options: {
      mode: canUpdate ? 'edition-owner' : 'viewonly',
      locale: currentLanguage ?? 'en',
      enableKeyboardEvents: true,
      enableAppBar: false,
      saveOnLoad: false,
    },
    persistenceManager: persistenceManager(
      `/mindmap/${params?.id}`,
      data?.name,
      t('mindmap.save.error', { ns: appCode }),
    ),
  });

  // Sauvegarde refusée par le serveur : on le dit, au lieu de laisser croire à un succès
  useEffect(() => {
    const onSaveError = () => setSaveFailed(true);
    globalThis.addEventListener(SAVE_ERROR_EVENT, onSaveError);
    return () => globalThis.removeEventListener(SAVE_ERROR_EVENT, onSaveError);
  }, []);

  const handleOnEditorSave = () => editor.model.save(true);

  // @ts-ignore
  const designer: Designer = globalThis.designer;

  return (
    data?.map && (
      <>
        {saveFailed && (
          // Le composant Alert du socle ne transmet pas `style` : sans ce conteneur, l'alerte restait dans le flux,
          // recouverte par l'en-tête fixe de l'éditeur (le message existait mais n'était pas visible).
          <div style={{ position: 'fixed', zIndex: 2000, top: 80, left: '50%', transform: 'translateX(-50%)', maxWidth: 'calc(100vw - 32px)' }} data-save-error>
            <Alert type="danger" isDismissible onClose={() => setSaveFailed(false)} className="m-16">
              {t('mindmap.save.error', { ns: appCode })}
            </Alert>
          </div>
        )}
        <AppHeader
          style={{ position: 'fixed' }}
          isFullscreen
          render={() => (
            <>
              {canExport ? (
                <Button variant="outline" onClick={() => setOpenModal(true)}>
                  {t('mindmap.export', { ns: appCode })}
                </Button>
              ) : null}
              {canUpdate ? (
                <Button
                  color="primary"
                  variant="filled"
                  className="ms-4"
                  onClick={handleOnEditorSave}
                >
                  {t('mindmap.save', { ns: appCode })}
                </Button>
              ) : null}
            </>
          )}
        >
          <Breadcrumb app={currentApp as IWebApp} name={data.name} />
        </AppHeader>
        <div className="mindplot-div-container">
          {canUpdate ? (
            <div className="undo-redo-toolbar">
              <Tooltip
                message={t('mindmap.undo', { ns: appCode })}
                placement="bottom-end"
              >
                <button aria-label={t('mindmap.undo', { ns: appCode })} onClick={() => designer.undo()}>
                  <IconUndo width={20} height={20} />
                </button>
              </Tooltip>
              <Tooltip
                message={t('mindmap.redo', { ns: appCode })}
                placement="bottom-end"
              >
                <button onClick={() => designer.redo()} aria-label={t('mindmap.redo', { ns: appCode })}>
                  <IconRedo width={20} height={20} />
                </button>
              </Tooltip>
            </div>
          ) : null}
          <Editor editor={editor} />
        </div>
        <Suspense fallback={<LoadingScreen />}>
          {openModal && (
            <ExportModal
              isOpen={openModal}
              setOpenModal={setOpenModal}
              mapName={data?.name}
            />
          )}
        </Suspense>
      </>
    )
  );
};
