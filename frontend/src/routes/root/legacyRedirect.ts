import { matchPath } from 'react-router-dom';

/** Chemin actuel d'un ancien lien à fragment (`#/view/:id`, `#/print/:id`, `#/print/png/:id`, `#/folder/:id`), sinon `null`. */
export const legacyRedirect = (hash: string): string | null => {
  const view = matchPath('/view/:id', hash);
  if (view) return `/id/${view.params.id}`;
  const print = matchPath('/print/png/:id', hash) ?? matchPath('/print/:id', hash);
  if (print) return `/print/id/${print.params.id}`;
  // Le dossier n'a pas d'adresse propre dans l'explorateur : on retombe sur la liste.
  if (matchPath('/folder/:id', hash)) return '/';
  return null;
};
