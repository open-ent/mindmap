import { createContext, useContext } from 'react';

/**
 * Indique si le module est monté « in-layout » dans un hôte (dashboard, CCTP 51C-2).
 * En embarqué, le module masque SON propre chrome (<Layout>) : l'hôte le fournit.
 * Défaut `false` → comportement standalone inchangé.
 */
export const EmbeddedContext = createContext<boolean>(false);

export const useIsEmbedded = (): boolean => useContext(EmbeddedContext);
