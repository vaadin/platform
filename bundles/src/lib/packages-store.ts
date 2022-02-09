import { PackageInfo } from './package-info';
import { posix as path } from 'path';
import { promises as fs } from 'fs';
import { ExposeInfo } from './expose-info';

export class PackagesStore {
  private packages = new Map<string, PackageInfo>();

  constructor(private modulesDirectory: string) { }

  public getLocalModuleId(moduleId: string): string {
    return moduleId.startsWith(this.modulesDirectory) 
      ? moduleId.substring(this.modulesDirectory.length + 1) : moduleId;
  }

  public async resolveModule(moduleId: string): Promise<[PackageInfo, {localModulePath: string}] | undefined> {
    const moduleSpecifier = this.getLocalModuleId(moduleId);

    const [scopeName, scopedPackageName] = moduleSpecifier.split('/', 2);
    const name = scopeName.startsWith('@') ? `${scopeName}/${scopedPackageName}` : scopeName;

    let packageInfo: PackageInfo;
    if (this.packages.has(name)) {
      packageInfo = this.packages.get(name);
    } else {
      const packageJson = JSON.parse(
        await fs.readFile(path.resolve(this.modulesDirectory, name, 'package.json'), { encoding: 'utf8' })
      );
      const version = packageJson.version;
      const exposes: Record<string, ExposeInfo> = {};
      packageInfo = {name, version, exposes};
      this.packages.set(name, packageInfo);
    }

    const localModulePath = `.${moduleSpecifier.substring(name.length)}`;
    packageInfo.exposes[localModulePath] = { exports: [] };

    return [packageInfo, {localModulePath}];
  }

  getBundleJson(): {packages: PackageInfo[]} {
    const packages = Array.from(this.packages.values());
    return {packages};
  }
}
