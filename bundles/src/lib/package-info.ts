import { ExposeInfo } from './expose-info';

export type PackageInfo = {
  name: string,
  version: string,
  exposes: Record<string, ExposeInfo>,
};