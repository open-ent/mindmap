/**
 * Entrée de montage « in-layout » (CCTP 51C-2) — modèle ISOLÉ (option B), 2e module pilote.
 *
 * Comme explorer, ce bundle `embed` est AUTO-CONTENU (embarque son propre React 18) et expose
 * `mount(el,ctx)` / `unmount(el)`. Spécificité mindmap : c'est une app ROUTÉE
 * (`react-router-dom`). Un `BrowserRouter` lirait l'URL de l'HÔTE (dashboard) → conflit. On monte
 * donc les mêmes routes derrière un **MemoryRouter** : la navigation interne (liste ↔ carte) reste
 * confinée au module, sans toucher l'URL du dashboard. Le `<Layout>` du module (rendu par la route
 * racine) est masqué via `EmbeddedContext` (l'hôte fournit le chrome).
 */
import {
  EdificeClientProvider,
  EdificeThemeProvider,
} from '@open-ent/react';
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRoot, type Root } from 'react-dom/client';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';

import { EmbeddedContext } from './embedded-context';
import { routes } from './routes';
import './i18n';
import '@open-ent/bootstrap/dist/index.css';

export interface MountContext {
  embedded?: boolean;
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: unknown) => {
      if (error === '0090') window.location.replace('/auth/login');
    },
  }),
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
  },
});

const roots = new WeakMap<HTMLElement, Root>();

/**
 * En mode embarqué, neutralise le décor plein-cadre de la skin 1D peint globalement
 * sur `<html data-product data-skin>` (sinon il bave dans le layout hôte). Idempotent.
 */
function injectEmbeddedReset(): void {
  const id = 'openent-embed-reset';
  if (typeof document === 'undefined' || document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent =
    'html[data-product][data-skin]{background-image:none!important;background-color:transparent!important}';
  document.head.appendChild(style);
}

export function mount(el: HTMLElement, ctx: MountContext = {}): void {
  const embedded = ctx.embedded ?? true;
  if (embedded) injectEmbeddedReset();
  const prev = roots.get(el);
  if (prev) prev.unmount();
  const root = createRoot(el);
  roots.set(el, root);

  // Routeur mémoire : navigation interne isolée de l'URL de l'hôte.
  const router = createMemoryRouter(routes, { initialEntries: ['/'] });

  root.render(
    <EmbeddedContext.Provider value={embedded}>
      <QueryClientProvider client={queryClient}>
        <EdificeClientProvider params={{ app: 'mindmap' }}>
          <EdificeThemeProvider>
            <RouterProvider router={router} />
          </EdificeThemeProvider>
        </EdificeClientProvider>
      </QueryClientProvider>
    </EmbeddedContext.Provider>,
  );
}

export function unmount(el: HTMLElement): void {
  roots.get(el)?.unmount();
  roots.delete(el);
}
