import zonasRaw from '@/data/zonas.json';

export type ZonasData = Record<string, Record<string, Record<string, string>>>;

const normalize = (s: string) =>
  (s || '')
    .toString()
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const zonas: ZonasData = zonasRaw as any;

export const getProvincias = (): string[] => {
  return Object.keys(zonas).sort();
};

export const getCantones = (provincia: string): string[] => {
  const p = zonas[normalize(provincia)];
  return p ? Object.keys(p).sort() : [];
};

export const getDistritos = (provincia: string, canton: string): string[] => {
  const p = zonas[normalize(provincia)];
  const c = p ? p[normalize(canton)] : undefined;
  return c ? Object.keys(c).sort() : [];
};

export const getTipoEnvio = (
  provincia: string,
  canton: string,
  distrito: string
): string | null => {
  const p = zonas[normalize(provincia)];
  const c = p ? p[normalize(canton)] : undefined;
  const d = c ? c[normalize(distrito)] : undefined;
  return d || null;
};
