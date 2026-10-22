import { useEffect, useState } from 'react';

import Editor, {
  Designer,
  ImageExporterFactory,
  useEditor,
  // @ts-ignore
} from '@edifice-wisemapping/editor';
import { Alert, Heading, Image, useEdificeClient } from '@open-ent/react';
import { useTranslation } from 'react-i18next';
import { odeServices } from '@open-ent/client';
import { LoaderFunctionArgs, useLoaderData, useParams } from 'react-router-dom';

import { DEFAULT_MAP } from '~/config';
import { mapInfo, persistenceManager } from '~/features/mindmap/configuration';
import { MindmapProps } from '~/models/mindmap';
import { getMindmap } from '~/services/api';
import './index.css';

export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;
  const data = await getMindmap(`/mindmap/${id}`);

  if (odeServices.http().isResponseError()) {
    throw new Response('', {
      status: odeServices.http().latestResponse.status,
      statusText: odeServices.http().latestResponse.statusText,
    });
  }

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

  const [hrefImage, setHrefImage] = useState<string>('');

  const { currentLanguage } = useEdificeClient();

  const editor = useEditor({
    mapInfo: mapInfo(data?.name, data?.name),
    options: {
      mode: 'viewonly',
      locale: currentLanguage ?? 'en',
      enableKeyboardEvents: false,
      enableAppBar: false,
      zoom: 1.5,
    },
    persistenceManager: persistenceManager(
      `/mindmap/${params?.id}`,
      data?.name,
    ),
  });

  const [failed, setFailed] = useState<boolean>(false);
  const { t } = useTranslation();

  useEffect(() => {
    //init pupetter config
    // @ts-ignore
    globalThis.pdfGeneratorConfig = {
      landscape: true,
    };
    // init designer
    // @ts-ignore
    const designer: Designer = globalThis.designer;
    // L'éditeur n'est pas monté : rien à imprimer. Avant, `designer.addEvent` plantait avant le test `if (designer)`.
    if (!designer) {
      setFailed(true);
      return;
    }
    designer.addEvent('loadSuccess', async () => {
      try {
        const workspace = designer.getWorkSpace();
        const svgElement = workspace.getSVGElement();
        const size = { width: window.innerWidth, height: window.innerHeight };
        const exporter = await ImageExporterFactory.create(
          'png',
          svgElement,
          size.width,
          size.height,
          true,
        );
        const imageData = await exporter.exportAndEncode();
        setHrefImage(imageData);
        setTimeout(() => window.print(), 1000);
      } catch (error) {
        console.error('Unexpected error during print:' + error);
        setFailed(true);
      }
    });
  }, []);

  if (failed) {
    return (
      <Alert type="danger" className="m-16">
        {t('mindmap.export.failed')}
      </Alert>
    );
  }

  return (
    data?.map && (
      <div className="mindplot-div-container">
        {hrefImage ? (
          <>
            <Heading headingStyle="h1" level="h1" className="p-16">
              {data.name}
            </Heading>
            <div id="printpngwrapper">
              <Image id="printpng" src={hrefImage} alt="" />
            </div>
          </>
        ) : (
          <Editor editor={editor} />
        )}
      </div>
    )
  );
};
