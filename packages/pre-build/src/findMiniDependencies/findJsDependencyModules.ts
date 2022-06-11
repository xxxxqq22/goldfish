import * as path from 'path';
import * as fs from 'fs-extra';
import * as lodash from 'lodash';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import resolveModule from './resolveModule';
import fileCache from './fileCache';

export type Dependency = {
  importPath: string;
  importFilePath: string;
  jsPath: string;
};

function correctImportPath(p: string) {
  if (p === '..' || p === '.') {
    return `${p}/`;
  }
  return p;
}

class Finder {
  private visited = new Set();

  run(jsPath: string) {
    if (!jsPath.startsWith('/') || jsPath.endsWith('.json') || this.visited.has(jsPath)) {
      return [];
    }
    this.visited.add(jsPath);

    return fileCache.run('findJsDependencyModules', jsPath, () => {
      const content = fs.readFileSync(jsPath).toString('utf-8');
      const ast = parse(content, { sourceType: 'module' });

      const result: Dependency[] = [];
      const record = (importPath: string) => {
        const importFilePath = resolveModule(correctImportPath(importPath), {
          paths: [path.dirname(jsPath)],
        });
        if (!importFilePath) {
          throw new Error(`Can not find the file \`${importPath}\` under \`${path.dirname(jsPath)}\`.`);
        }
        result.push({
          importPath,
          importFilePath,
          jsPath,
        });
        result.push(...this.run(importFilePath));
      };
      traverse(ast, {
        ImportDeclaration: babelPath => {
          record(babelPath.node.source.value);
        },
        ExportNamedDeclaration(babelPath) {
          const value = babelPath.node.source?.value;
          if (!value) {
            return;
          }
          record(value);
        },
        ExportAllDeclaration(babelPath) {
          record(babelPath.node.source.value);
        },
        CallExpression: babelPath => {
          const callee = babelPath.node.callee as { name?: string };
          if (callee.name !== 'require' || babelPath.scope.hasBinding('require')) {
            return;
          }
          const value = (babelPath.node.arguments[0] as { value?: string }).value;
          if (value) {
            record(value);
          }
        },
      });
      const uniqResult = lodash.uniqBy(result, dep => dep.importFilePath);
      return uniqResult;
    });
  }
}

export default function findJsDependencyModules(jsPath: string) {
  return new Finder().run(jsPath);
}
