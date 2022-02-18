import { Plugin } from 'rollup';
import { posix as path } from 'path';
import { createFilter, FilterPattern } from '@rollup/pluginutils';
import type { Program } from 'estree';
import { walk } from 'estree-walker';
import type { FunctionDeclaration, VariableDeclarator, Property, Identifier } from 'estree';
import { BundleStore } from './bundle-store';

export const bundleInfoRollupPlugin = (options: { modulesDirectory?: string, include?: FilterPattern, exclude?: FilterPattern } = {}): Plugin => {
  const modulesDirectory = options.modulesDirectory || path.resolve(process.cwd(), './node_modules');
  const bundleStore = new BundleStore(modulesDirectory);
  const filter = createFilter(options.include, options.exclude);

  return {
    name: 'bundleInfoRollupPlugin',
    async resolveId(source, importer, options) {
      if (options.isEntry) {
        return null;
      }

      if (source === '@vaadin/app-layout/drawer-toggle.js') {
        source = '@vaadin/app-layout/vaadin-drawer-toggle.js';
      }

      const resolution = await this.resolve(source, importer, {
        skipSelf: true,
        ...options
      });

      let id = source.startsWith('.') ? resolution.id : source;
      if (!resolution.id.startsWith(modulesDirectory)) {
        return null;
      }

      const [packageInfo, {name}] = await bundleStore.resolveModule(id);
      if (!packageInfo.exposes['.']) {
        if (!options.custom?.bundleInfoRollupPlugin?.isPackageEntry) {
          try {
            await this.resolve(name, importer, {
              ...options,
              custom: {
                bundleInfoRollupPlugin: {
                  isPackageEntry: true,
                },
              },
            });
          } catch (_) { }
        } else {
          packageInfo.exposes['.'] = {
            exports: [
              {
                source: bundleStore.getLocalModuleId(resolution.id),
              },
            ],
          };
        }
      }

      return resolution;
    },

    async transform(code, sourceId) {
      if (!filter(sourceId)) return;
      if (!sourceId.startsWith(modulesDirectory)) return;

      const id = bundleStore.getLocalModuleId(sourceId);
      const [packageInfo, {localModulePath}] = await bundleStore.resolveModule(id)
      if (!packageInfo.exposes[localModulePath]) {
        packageInfo.exposes[localModulePath] = { exports: [] };
      }
      const exports = packageInfo.exposes[localModulePath].exports;

      const ast = this.parse(code);

      const getTargetId = async (value: string) => {
        const targetResolution = await this.resolve(value, sourceId);
        const targetSourceId = targetResolution.id;
        return bundleStore.getLocalModuleId(targetSourceId);
      };

      for (const topLevelNode of (ast as unknown as Program).body) {
        if (topLevelNode.type === 'ExportAllDeclaration') {
          const namespace = topLevelNode.exported ? topLevelNode.exported.name : undefined;
          const source = await getTargetId(topLevelNode.source.value as string);
          exports.push({namespace, source});
        } else if (topLevelNode.type === 'ExportDefaultDeclaration') {
          exports.push('default');
        } else if (topLevelNode.type === 'ExportNamedDeclaration') {
          if (topLevelNode.declaration) {
            walk(topLevelNode.declaration, {
              enter(node, parent) {
                if (node.type === 'BlockStatement' 
                  || node.type === 'ClassBody'
                  || (parent && parent.type === 'VariableDeclarator' && (parent as VariableDeclarator).init === node)
                  || (parent && parent.type === 'Property' && (parent as Property).value === node)
                  || (parent && parent.type === 'FunctionDeclaration' && (parent as FunctionDeclaration).id !== node)) {
                  this.skip();
                } else if (node.type === 'Identifier') {
                  this.skip();
                  exports.push((node as Identifier).name);
                }
              }
            });
          } else {
            for (const specifier of topLevelNode.specifiers) {
              exports.push(specifier.exported.name);
            }
          }
        }
      }

      return {
        moduleSideEffects: 'no-treeshake',
      };
    },

    renderChunk() {
      return '';
    },

    generateBundle() {
      console.log(Object.keys(bundleStore.getBundleJson().packages));
      this.emitFile({
        type: 'asset',
        fileName: 'vaadin-bundle.json',
        source: JSON.stringify(bundleStore.getBundleJson(), undefined, 2),
      });
    }
  };
}