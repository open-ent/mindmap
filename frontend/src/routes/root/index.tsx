import { Layout, LoadingScreen, useEdificeClient } from '@open-ent/react';
import { Outlet } from 'react-router-dom';

import { basename } from '..';
import { legacyRedirect } from './legacyRedirect';
import { useIsEmbedded } from '~/embedded-context';

/** Check old format URL and redirect if needed */
export const loader = async () => {
  const hashLocation = location.hash.substring(1);

  // Check if the URL is an old format (angular root with hash) and redirect to the new format
  if (hashLocation) {
    // Anciens liens de l'AngularJS : consultation, impression (page et image), dossier. L'impression est la cible du
    // lien de publication dans la bibliothèque (`/mindmap#/print/png/:id`).
    const redirectPath = legacyRedirect(hashLocation);

    if (redirectPath) {
      location.replace(
        location.origin + basename.replace(/\/$/g, '') + redirectPath,
      );
    }
  }

  return null;
};

export function Root() {
  const { init } = useEdificeClient();
  // En montage in-layout (dashboard), l'hôte fournit le chrome : on masque le <Layout>.
  const embedded = useIsEmbedded();

  if (!init) return <LoadingScreen position={false} />;

  if (embedded) return <Outlet />;

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export default Root;
