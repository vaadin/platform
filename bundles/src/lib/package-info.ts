import { ExposeInfo } from './expose-info';

export type PackageInfo = {
  version: string,
  exposes: Record<string, ExposeInfo>,
};