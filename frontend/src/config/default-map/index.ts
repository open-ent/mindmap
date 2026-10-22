/**
 * Échappe un texte pour l'insérer dans un attribut XML. Sans cela, un nom de carte comme « Maths & Sciences » ou
 * « L'"idée" » produisait un XML invalide : la carte ne s'ouvrait plus (`DOMParser` en erreur).
 */
export const escapeXml = (value: string): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export const DEFAULT_MAP = (name: string) =>
  `<map version="tango" theme="prism"><topic central="true" text="${escapeXml(name)}"/></map>`;
