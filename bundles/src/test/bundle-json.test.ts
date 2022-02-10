import { describe, it } from 'mocha';
import { expect } from 'chai';
import { readFile } from 'fs/promises';
import { PackageInfo } from '../lib/package-info';

describe('vaadin-bundle.json', () => {
  const packages = new Map<string, PackageInfo>();
  let bundleVersion;

  before(async () => {
    const vaadinBundleJson: {packages: PackageInfo[]} = JSON.parse(
      await readFile('vaadin-bundle.json', { encoding: 'utf8' })
    );

    vaadinBundleJson.packages.forEach(packageInfo => {
      packages.set(packageInfo.name, packageInfo);
    });

    bundleVersion = JSON.parse(
      await readFile('package.json', {encoding: 'utf8'})
    ).version;
  });

  class PackageNotFoundError extends Error {
    constructor(packageName: string) {
      super(`Package not found: ${packageName}`);
    }
  }

  function getPackage(name: string): PackageInfo {
    if (!packages.has(name)) {
      throw new PackageNotFoundError(name);
    }

    return packages.get(name);
  }
  
  it('should contain Vaadin components', () => {
    expect(getPackage('@vaadin/button').version).to.equal(bundleVersion);
    expect(getPackage('@vaadin/grid').version).to.equal(bundleVersion);
    expect(getPackage('@vaadin/charts').version).to.equal(bundleVersion);
  });

  it('should contain Vaadin dependencies', () => {
    getPackage('lit');
    getPackage('highcharts');
  });

  it('shoud not contain nonsene', () => {
    expect(() => getPackage('nonsense')).to.throw(PackageNotFoundError);
  });
});
