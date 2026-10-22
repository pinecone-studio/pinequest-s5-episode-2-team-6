/** Resolver hook that lets Node load the app's extensionless TypeScript imports.
 *  The browser build resolves them through Vite; plain Node needs the extension.
 *  The hook is synchronous so it works with both module.registerHooks and module.register. */
import {existsSync} from 'node:fs';
import {fileURLToPath, pathToFileURL} from 'node:url';

export function resolve(specifier, context, nextResolve) {
  const relative = specifier.startsWith('./') || specifier.startsWith('../');
  if (relative && !/\.[cm]?[jt]sx?$/.test(specifier)) {
    const parent = context.parentURL ?? pathToFileURL(`${process.cwd()}/`);
    const target = new URL(specifier, parent);
    for (const extension of ['.ts', '.tsx', '.js']) {
      const candidate = new URL(`${target.href}${extension}`);
      if (existsSync(fileURLToPath(candidate))) return nextResolve(candidate.href, context);
    }
  }
  return nextResolve(specifier, context);
}
