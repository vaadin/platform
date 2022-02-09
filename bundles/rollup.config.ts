import { nodeResolve } from '@rollup/plugin-node-resolve';
import { RollupOptions } from 'rollup';
import { posix as path } from 'path';
import { bundleInfoRollupPlugin } from './src/lib/bundle-info-rollup-plugin';

const modulesDirectory = path.resolve('./node_modules');

const rollupOptions: RollupOptions = {
  input: 'src/vaadin.js',
  preserveSymlinks: true,
  plugins: [
    bundleInfoRollupPlugin({modulesDirectory}),
    nodeResolve({
      
    }),
  ],
  output: {
    format: 'esm',
    dir: path.resolve('./'),
    sourcemap: false,
    inlineDynamicImports: true,
  },
};

export default rollupOptions;