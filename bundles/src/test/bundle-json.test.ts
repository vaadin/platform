import { describe, it } from 'mocha';
import { expect } from 'chai';
import { readFile } from 'fs/promises';
import { BundleJson } from '../lib/bundle-json';
import { PackageInfo } from '../lib/package-info';

describe('vaadin-bundle.json', () => {
  let bundleJson: BundleJson;
  let bundleVersion;

  before(async () => {
    bundleJson = JSON.parse(
      await readFile('vaadin-bundle.json', { encoding: 'utf8' })
    );

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
    if (!bundleJson.packages[name]) {
      throw new PackageNotFoundError(name);
    }

    return bundleJson.packages[name];
  }

  it('should contain Vaadin components', () => {
    expect(getPackage('@vaadin/button').version).to.equal(bundleVersion);
    expect(getPackage('@vaadin/grid').version).to.equal(bundleVersion);
    expect(getPackage('@vaadin/charts').version).to.equal(bundleVersion);
  });

  it('should contain Vaadin dependencies', () => {
    const lit = getPackage('lit');
    expect(lit.exposes['./index.js'].exports).to.deep.include(
      {
        source: 'lit-element/lit-element.js',
      },
    );
    getPackage('highcharts');
  });

  it('shoud not contain nonsene', () => {
    expect(() => getPackage('nonsense')).to.throw(PackageNotFoundError);
  });
});
