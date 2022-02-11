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
    const button = getPackage('@vaadin/button');
    expect(button.version).to.equal(bundleVersion);
    expect(button.exposes).to.deep.equal({
      ".": {
        "exports": [
          {
            "source": "@vaadin/button/vaadin-button.js",
          },
        ],
      },
      "./vaadin-button.js": {
        "exports": [
          {
            "source": "@vaadin/button/src/vaadin-button.js",
          },
        ],
      },
      "./src/vaadin-button.js": {
        "exports": [
          "Button",
        ],
      },
      "./theme/lumo/vaadin-button.js": {
        "exports": [],
      },
      "./theme/lumo/vaadin-button-styles.js": {
        "exports": [
          "button",
        ],
      },
    });

    expect(getPackage('@vaadin/grid').version).to.equal(bundleVersion);
    expect(getPackage('@vaadin/charts').version).to.equal(bundleVersion);
  });

  it('should contain Vaadin dependencies', () => {
    const polymer = getPackage('@polymer/polymer');
    expect(polymer.version).to.match(/^3\./);
    expect(polymer.exposes['.'].exports).to.deep.include({
      "source": "@polymer/polymer/polymer-element.js",
    });
    expect(polymer.exposes['./polymer-element.js'].exports).to.include("html", "PolymerElement");

    const lit = getPackage('lit');
    expect(lit.exposes['.'].exports).to.deep.include({
      "source": "lit/index.js",
    });
    expect(lit.exposes['./index.js'].exports).to.deep.include({
      source: 'lit-element/lit-element.js',
    });

    getPackage('highcharts');
  });

  it('shoud not contain itself', () => {
    expect(() => getPackage('@vaadin/bundles')).to.throw(PackageNotFoundError);
  });
});
