import { default as ModuleFederationPlugin } from 'webpack/lib/container/ModuleFederationPlugin.js';
import { readFile } from 'fs/promises';
import { posix as path } from 'path';
import { BundleJson } from './src/lib/bundle-json';

const bundleJson: BundleJson = JSON.parse(await readFile('vaadin-bundle.json', {encoding: 'utf8'}));
const exposes = Object.entries(bundleJson.packages).flatMap(([packageName, packageInfo]) => 
  Object.keys(packageInfo.exposes).map((modulePath) => {
    const moduleSpecifier = `${packageName}${modulePath.substring(1)}`;
    return `./node_modules/${moduleSpecifier}`;
  }));

export default {
  mode: 'development',
  entry: {
    vaadin: './src/vaadin.js',
  },
  resolve: {
    symlinks: false,
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false,
        },
      },
    ],
  },
  devtool: 'source-map',
  experiments: {
    outputModule: true,
  },
  output: {
    path: path.resolve(''),
    filename: '[name].js',
    library: {
      type: 'module',
    },
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'vaadin',
      library: {
        type: 'module',
      },
      exposes

      // Possible alternative: shared modules instead of “exposes” above
      //
      // Pros:
      // - enables runtime resolution using versions of every module
      // - consumer app can provide its own module instead of the bundled dependency
      // - bundled dependency can override consumer module, e. g., if its old
      //
      // Cons:
      // - more complicated
      // - undocumented API, heavily relies on webpack runtime in the consumer app
      // - more metadata is uncluded, increases the bundle’s file size
      //
      // shared: Object.fromEntries(
      //   Object.keys(require('./dist/modules.json').modules).map(moduleId => [
      //     moduleId, { eager: true, singleton: true, }
      //   ])
      // ),
    }),
  ],
};