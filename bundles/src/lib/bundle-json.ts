import { PackageInfo } from "./package-info";

export type BundleJson = {
  packages: Record<string, PackageInfo>,
};