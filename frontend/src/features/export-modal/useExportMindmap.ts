import { useEffect, useState } from 'react';

import { OptionsType } from '@open-ent/react';

import { exporter } from '~/utils';

type ExportFormat = 'svg' | 'jpg' | 'png' | 'mm' | 'wxml';
type ExportGroup = 'image' | 'mindmap-tool';

export const useExportMindmap = ({
  mapName,
  onSuccess,
}: {
  mapName: string;
  onSuccess: () => void;
}) => {
  const [submit, setSubmit] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('jpg');
  const [exportGroup, setExportGroup] = useState<ExportGroup>('image');
  const [zoomToFit, setZoomToFit] = useState<boolean>(true);
  // L'export a échoué (éditeur absent, carte vide…) : la modale le dit au lieu de ne rien faire.
  const [failed, setFailed] = useState<boolean>(false);

  const imagesOptions = [
    {
      label: 'JPEG Image (JPEG)',
      value: 'jpg',
    },
    {
      label: 'Portable Network Graphics (PNG)',
      value: 'png',
    },
    {
      label: 'Scalable Vector Graphics (SVG)',
      value: 'svg',
    },
  ];

  const formatOptions = [
    {
      label: 'WiseMapping (WXML)',
      value: 'wxml',
    },
    {
      label: 'Freemind 1.0.1 (MM)',
      value: 'mm',
    },
  ];

  const handleOnSubmit = (): void => {
    setFailed(false);
    setSubmit(true);
  };

  const handleOnZoomToFit = (): void => {
    setZoomToFit(!zoomToFit);
  };

  const handleOnExportFormatChange = (option: OptionsType | string) => {
    setExportFormat(option as ExportFormat);
  };

  const handleOnGroupChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    let defaultFormat: ExportFormat;
    switch (value) {
      case 'image':
        defaultFormat = 'svg';
        break;
      case 'mindmap-tool':
        defaultFormat = 'wxml';
        break;
      default:
        defaultFormat = 'svg';
    }
    setExportGroup(value as unknown as ExportGroup);
    setExportFormat(defaultFormat);
  };

  useEffect(() => {
    if (submit) {
      exporter(exportFormat, zoomToFit)
        .then((url: string) => {
          // Create hidden anchor to force download ...
          const anchor: HTMLAnchorElement = document.createElement('a');
          anchor.style.display = 'display: none';
          anchor.download = `${mapName}.${exportFormat}`;
          anchor.href = url;
          document.body.appendChild(anchor);

          // Trigger click ...
          anchor.click();

          // Clean up ...
          URL.revokeObjectURL(url);
          document.body.removeChild(anchor);
          onSuccess?.();
        })
        .catch((fail) => {
          console.error('Unexpected error during export:' + fail);
          setFailed(true);
        });
    }
    setSubmit(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submit]);

  return {
    imagesOptions,
    formatOptions,
    handleOnSubmit,
    handleOnExportFormatChange,
    handleOnZoomToFit,
    handleOnGroupChange,
    exportGroup,
    exportFormat,
    zoomToFit,
    failed,
  };
};
