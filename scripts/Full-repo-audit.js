/**
 * FULL MONOREPO AUDIT
 * --------------------
 * Run from your monorepo root (or place inside scripts/ and run: node scripts/full-repo-audit.js)
 *
 * What it does:
 *  1. Auto-detects your workspaces (apps/*, packages/*) and each one's framework
 *     (Next.js / React Router / Express / NestJS / React Native) from package.json.
 *  2. Walks EVERY .js/.jsx/.ts/.tsx file in the repo and builds a real import graph
 *     (handles relative imports AND internal workspace packages like "@repo/shared").
 *  3. Flags files that are never imported by anything (orphans) - excluding known
 *     entry points (index, App, pages, routes, tests, config files).
 *  4. Finds frontend "pages" (Next.js pages/app router, or React Router <Route> paths)
 *     and backend "routes" (Express router.get/post/etc, NestJS @Controller/@Get/@Post).
 *  5. Scans frontend code for fetch()/axios() calls and tries to match each API path
 *     against a discovered backend route, so you can see calls that point to nothing,
 *     and backend routes that no frontend code calls.
 *  6. Writes everything to /audit-report/ as CSV + a human-readable SUMMARY.md.
 *
 * IMPORTANT - this is heuristic, not a compiler. It will catch the vast majority of
 * real issues, but always spot-check anything it flags before deleting/refactoring.
 * Known blind spots are listed at the bottom of SUMMARY.md.
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(REPO_ROOT, 'audit-report');
const CODE_EXT = ['.js', '.jsx', '.ts', '.tsx', '.cjs', '.mjs'];
const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', '.expo', 'coverage', 'audit-report', '.turbo', '.cache']);

const ENTRY_POINT_PATTERNS = [
  /^index\.(js|jsx|ts|tsx)$/i, /^main\.(js|jsx|ts|tsx)$/i, /^app\.(js|jsx|ts|tsx)$/i,
  /^_app\.(js|jsx|ts|tsx)$/i, /^_document\.(js|jsx|ts|tsx)$/i, /^layout\.(js|jsx|ts|tsx)$/i,
  /^page\.(js|jsx|ts|tsx)$/i, /^server\.(js|ts)$/i, /\.test\.(js|jsx|ts|tsx)$/i,
  /\.spec\.(js|jsx|ts|tsx)$/i, /\.d\.ts$/i, /^next\.config\./i, /^babel\.config\./i,
  /^metro\.config\./i, /^tailwind\.config\./i, /^jest\.config\./i,
];

// ---------- helpers ----------
function readJSON(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return null; }
}

function getAllFiles(dir, out = []) {
  let list;
  try { list = fs.readdirSync(dir); } catch (e) { return out; }
  for (const name of list) {
    const full = path.join(dir, name);
    let stat;
    try { stat = fs.statSync(full); } catch (e) { continue; }
    if (stat.isDirectory()) {
      if (!IGNORE_DIRS.has(name)) getAllFiles(full, out);
    } else if (CODE_EXT.includes(path.extname(full))) {
      out.push(full);
    }
  }
  return out;
}

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

// ---------- 1. discover workspaces ----------
function discoverWorkspaces() {
  const rootPkg = readJSON(path.join(REPO_ROOT, 'package.json')) || {};
  let patterns = rootPkg.workspaces;
  if (patterns && patterns.packages) patterns = patterns.packages; // yarn/pnpm object form
  if (!patterns) patterns = ['apps/*', 'packages/*'];

  const dirs = new Set();
  patterns.forEach(pattern => {
    const clean = pattern.replace(/\/\*+$/, '');
    const base = path.join(REPO_ROOT, clean);
    if (!fs.existsSync(base)) return;
    if (pattern.endsWith('*')) {
      fs.readdirSync(base).forEach(name => {
        const full = path.join(base, name);
        if (fs.statSync(full).isDirectory() && fs.existsSync(path.join(full, 'package.json'))) {
          dirs.add(full);
        }
      });
    } else if (fs.existsSync(path.join(base, 'package.json'))) {
      dirs.add(base);
    }
  });
  return Array.from(dirs);
}

function detectAppType(pkg) {
  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  if (deps['next']) return 'nextjs';
  if (deps['@nestjs/core']) return 'nestjs';
  if (deps['express']) return 'express';
  if (deps['react-native'] || deps['expo']) return 'react-native';
  if (deps['react-router-dom'] || deps['react-router']) return 'react-router';
  if (deps['react']) return 'react-generic';
  return 'unknown';
}

const workspaceDirs = discoverWorkspaces();
const workspaces = workspaceDirs.map(dir => {
  const pkg = readJSON(path.join(dir, 'package.json')) || {};
  return {
    dir,
    name: pkg.name || path.basename(dir),
    type: detectAppType(pkg),
    pkg,
  };
});

// package name -> resolved entry file, for resolving "@repo/shared" style imports
const packageEntryMap = new Map();
workspaces.forEach(ws => {
  const mainField = ws.pkg.main || ws.pkg.module || 'src/index.ts';
  const candidates = [
    path.join(ws.dir, mainField),
    ...CODE_EXT.map(ext => path.join(ws.dir, 'src', 'index' + ext)),
    ...CODE_EXT.map(ext => path.join(ws.dir, 'index' + ext)),
  ];
  const entry = candidates.find(c => fs.existsSync(c));
  packageEntryMap.set(ws.name, { entry, root: ws.dir });
});

// ---------- 2. full file list + import graph ----------
const allFiles = [];
workspaces.forEach(ws => getAllFiles(ws.dir, allFiles));
// de-dupe in case workspace globs overlap
const uniqueFiles = Array.from(new Set(allFiles));

function extractSpecifiers(content) {
  const specifiers = [];
  const patterns = [
    /(?:import|export)[^'"()]*?from\s*['"]([^'"]+)['"]/g,
    /(?:import|require)\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  patterns.forEach(re => {
    let m;
    while ((m = re.exec(content)) !== null) specifiers.push(m[1]);
  });
  return specifiers;
}

function resolveRelative(specifier, fromFile) {
  const base = path.resolve(path.dirname(fromFile), specifier);
  const candidates = [
    base,
    ...CODE_EXT.map(ext => base + ext),
    ...CODE_EXT.map(ext => path.join(base, 'index' + ext)),
  ];
  return candidates.find(c => fs.existsSync(c) && fs.statSync(c).isFile()) || null;
}

function resolveSpecifier(specifier, fromFile) {
  if (specifier.startsWith('.')) return resolveRelative(specifier, fromFile);
  // internal workspace package, e.g. "@repo/shared" or "@repo/shared/utils/foo"
  // or "@repo/shared/src/services/foo" (some codebases import the "src" segment explicitly)
  for (const [pkgName, info] of packageEntryMap.entries()) {
    if (specifier === pkgName) return info.entry || null;
    if (specifier.startsWith(pkgName + '/')) {
      const sub = specifier.slice(pkgName.length + 1);
      // try sub AS-IS relative to package root (covers "src/..." already included),
      // then again with an extra "src/" prepended (covers shorthand without "src")
      const bases = [path.join(info.root, sub), path.join(info.root, 'src', sub)];
      for (const base of bases) {
        const candidates = [base, ...CODE_EXT.map(ext => base + ext), ...CODE_EXT.map(ext => path.join(base, 'index' + ext))];
        const found = candidates.find(c => fs.existsSync(c) && fs.statSync(c).isFile());
        if (found) return found;
      }
    }
  }
  return null; // external npm package - not tracked
}

const usedBy = new Map(); // absolute file -> Set(importer files)
uniqueFiles.forEach(f => usedBy.set(f, new Set()));
const fileMeta = new Map(); // absolute file -> {specifiers, purpose}
const brokenImports = []; // {file, specifier} - import that resolves to nothing on disk

uniqueFiles.forEach(file => {
  let raw = '';
  try { raw = fs.readFileSync(file, 'utf8'); } catch (e) {}
  const content = stripComments(raw);
  const specifiers = extractSpecifiers(content);
  specifiers.forEach(spec => {
    const resolved = resolveSpecifier(spec, file);
    if (resolved && usedBy.has(resolved)) {
      usedBy.get(resolved).add(file);
    } else if (spec.startsWith('.')) {
      // relative import ('./x' or '../x') that did not resolve to any real file = broken
      brokenImports.push({ file, specifier: spec });
    } else {
      // internal workspace package import (e.g. "@repo/shared/utils/foo") that failed to resolve
      const isInternalPkg = Array.from(packageEntryMap.keys()).some(pkgName =>
        spec === pkgName || spec.startsWith(pkgName + '/'));
      if (isInternalPkg) brokenImports.push({ file, specifier: spec });
    }
  });
  fileMeta.set(file, { raw, specifiers });
});

function isEntryPoint(file) {
  return ENTRY_POINT_PATTERNS.some(re => re.test(path.basename(file)));
}

function guessPurpose(file, raw) {
  const base = path.basename(file);
  const docMatch = raw.match(/\/\*\*([\s\S]*?)\*\//) || raw.match(/^\s*\/\/\s*(.+)$/m);
  if (docMatch) {
    const text = docMatch[1].replace(/\*/g, '').replace(/\s+/g, ' ').trim();
    if (text.length > 5 && text.length < 140) return text;
  }
  const lower = base.toLowerCase();
  if (/\.test\.|\.spec\./.test(lower)) return 'Test file';
  if (lower.includes('controller')) return 'Backend controller';
  if (lower.includes('route') || lower.includes('router')) return 'Route definitions';
  if (lower.includes('service')) return 'Service module';
  if (lower.includes('model') || lower.includes('schema')) return 'Data model / schema';
  if (lower.includes('middleware')) return 'Middleware';
  if (lower.startsWith('use') && /^use[A-Z]/.test(base)) return 'React hook';
  if (lower.includes('screen')) return 'Mobile screen';
  if (lower.includes('page')) return 'Page component';
  if (/^[A-Z]/.test(base) && /return\s*\(?\s*</.test(raw)) return 'React component';
  if (lower.includes('util') || lower.includes('helper')) return 'Utility functions';
  if (lower.includes('config')) return 'Config file';
  if (lower.includes('context') || lower.includes('provider')) return 'React context/provider';
  if (lower.includes('store') || lower.includes('slice') || lower.includes('reducer')) return 'State management';
  return 'Unclassified';
}

function categoryFor(file) {
  const ws = workspaces.find(w => file.startsWith(w.dir + path.sep));
  if (!ws) return 'unknown';
  if (['express', 'nestjs'].includes(ws.type)) return 'backend';
  if (ws.dir.includes(`${path.sep}packages${path.sep}`)) return 'shared';
  return 'frontend';
}

// ---------- 3. pages / routes discovery ----------
const frontendPages = []; // {file, routePath, workspace}
const backendRoutes = []; // {file, method, routePath, workspace}

workspaces.forEach(ws => {
  const wsFiles = uniqueFiles.filter(f => f.startsWith(ws.dir + path.sep));

  if (ws.type === 'nextjs') {
    wsFiles.forEach(f => {
      const relToWs = path.relative(ws.dir, f).replace(/\\/g, '/');
      if (/^pages\//.test(relToWs) && !/^pages\/api\//.test(relToWs) && !/^pages\/_(app|document)/.test(relToWs)) {
        frontendPages.push({ file: f, routePath: relToWs, workspace: ws.name });
      } else if (/^pages\/api\//.test(relToWs)) {
        backendRoutes.push({ file: f, method: 'ANY', routePath: relToWs, workspace: ws.name });
      } else if (/^app\/.*\/page\.(js|jsx|ts|tsx)$/.test(relToWs)) {
        frontendPages.push({ file: f, routePath: relToWs, workspace: ws.name });
      } else if (/^app\/.*\/route\.(js|ts)$/.test(relToWs)) {
        backendRoutes.push({ file: f, method: 'ANY', routePath: relToWs, workspace: ws.name });
      }
    });
  }

  if (ws.type === 'react-router' || ws.type === 'react-generic') {
    wsFiles.forEach(f => {
      const content = fileMeta.get(f)?.raw || '';
      const re = /<Route\s+[^>]*path\s*=\s*{?["'`]([^"'`]+)["'`]/g;
      let m;
      while ((m = re.exec(content)) !== null) {
        frontendPages.push({ file: f, routePath: m[1], workspace: ws.name });
      }
    });
  }

  if (ws.type === 'express') {
    // Pass A: collect relative routes defined inside each router file.
    // Supports two styles:
    //   1) router.get('/path', handler)
    //   2) router.route('/path').get(handler).post(handler)   <-- chained style
    const relativeRoutesByFile = new Map(); // file -> [{method, routePath}]
    wsFiles.forEach(f => {
      const content = fileMeta.get(f)?.raw || '';
      const list = [];

      // Style 1: router.get('/path', ...)
      const simpleRe = /(?:router|app)\.(get|post|put|delete|patch)\(\s*['"`]([^'"`]+)['"`]/g;
      let m;
      while ((m = simpleRe.exec(content)) !== null) list.push({ method: m[1].toUpperCase(), routePath: m[2] });

      // Style 2: router.route('/path').get(...).post(...);
      const chainRe = /router\.route\(\s*['"`]([^'"`]+)['"`]\s*\)((?:\s*\.\s*(?:get|post|put|delete|patch)\s*\([^;]*?\))+)\s*;/g;
      let cm;
      while ((cm = chainRe.exec(content)) !== null) {
        const routePath = cm[1];
        const chain = cm[2];
        const methodRe = /\.(get|post|put|delete|patch)\s*\(/g;
        let mm;
        while ((mm = methodRe.exec(chain)) !== null) list.push({ method: mm[1].toUpperCase(), routePath });
      }

      if (list.length) relativeRoutesByFile.set(f, list);
    });

    // Pass B: find app.use('/mount/prefix', someVar) and match someVar back to the
    // route file it was require()'d/imported from, so we can combine mount + relative path.
    const mountPrefixesByFile = new Map(); // route file -> Set(prefixes)
    wsFiles.forEach(f => {
      const content = fileMeta.get(f)?.raw || '';
      // map local variable name -> resolved file, from requires/imports in this file
      const localVarToFile = new Map();
      const importRe = /(?:const|let|var)\s+(\w+)\s*=\s*require\(\s*['"`]([^'"`]+)['"`]\s*\)|import\s+(\w+)\s+from\s*['"`]([^'"`]+)['"`]/g;
      let im;
      while ((im = importRe.exec(content)) !== null) {
        const varName = im[1] || im[3];
        const spec = im[2] || im[4];
        if (!varName || !spec) continue;
        const resolved = resolveSpecifier(spec, f) || resolveRelative(spec, f);
        if (resolved) localVarToFile.set(varName, resolved);
      }
      const useRe = /app\.use\(\s*['"`]([^'"`]+)['"`]\s*,\s*(\w+)/g;
      let um;
      while ((um = useRe.exec(content)) !== null) {
        const prefix = um[1];
        const varName = um[2];
        const targetFile = localVarToFile.get(varName);
        if (targetFile) {
          if (!mountPrefixesByFile.has(targetFile)) mountPrefixesByFile.set(targetFile, new Set());
          mountPrefixesByFile.get(targetFile).add(prefix);
        }
      }
    });

    // Combine: for each route file's relative routes, join with every known mount
    // prefix. If no prefix was found anywhere, keep the relative path (best effort)
    // and mark it so the report is honest about the gap.
    relativeRoutesByFile.forEach((routes, file) => {
      const prefixes = mountPrefixesByFile.get(file);
      routes.forEach(r => {
        if (prefixes && prefixes.size) {
          prefixes.forEach(prefix => {
            const full = (prefix.replace(/\/+$/, '') + '/' + r.routePath.replace(/^\/+/, '')).replace(/\/+/g, '/');
            backendRoutes.push({ file, method: r.method, routePath: full, workspace: ws.name });
          });
        } else {
          backendRoutes.push({ file, method: r.method, routePath: r.routePath, workspace: ws.name, mountUnknown: true });
        }
      });
    });
  }

  if (ws.type === 'nestjs') {
    wsFiles.forEach(f => {
      const content = fileMeta.get(f)?.raw || '';
      const ctrlMatch = content.match(/@Controller\(\s*['"`]?([^'")`]*)['"`]?\s*\)/);
      const base = ctrlMatch ? ctrlMatch[1] : '';
      const re = /@(Get|Post|Put|Delete|Patch)\(\s*['"`]?([^'")`]*)['"`]?\s*\)/g;
      let m;
      while ((m = re.exec(content)) !== null) {
        const full = ['', base, m[2]].filter(Boolean).join('/').replace(/\/+/g, '/');
        backendRoutes.push({ file: f, method: m[1].toUpperCase(), routePath: full || '/', workspace: ws.name });
      }
    });
  }
});

// ---------- 4. frontend API call scan ----------
const apiCalls = []; // {file, url}
uniqueFiles.forEach(f => {
  const category = categoryFor(f);
  if (category !== 'frontend') return;
  const content = fileMeta.get(f)?.raw || '';
  const patterns = [
    /fetch\(\s*[`'"]([^`'"]+)[`'"]/g,
    /axios\.(?:get|post|put|delete|patch)\(\s*[`'"]([^`'"]+)[`'"]/g,
    /axios\(\s*{\s*[^}]*url:\s*[`'"]([^`'"]+)[`'"]/g,
  ];
  patterns.forEach(re => {
    let m;
    while ((m = re.exec(content)) !== null) apiCalls.push({ file: f, url: m[1] });
  });
});

function normalizePath(p) {
  return p
    .replace(/^https?:\/\/[^/]+/i, '')
    .replace(/\$\{[^}]+\}/g, '') // template literal vars
    .replace(/\?.*$/, '')
    .replace(/:[a-zA-Z0-9_]+/g, '*') // express-style params
    .replace(/\[[a-zA-Z0-9_]+\]/g, '*') // next-style params
    .replace(/\/+$/, '')
    .toLowerCase();
}

const normalizedRoutes = backendRoutes.map(r => ({ ...r, norm: normalizePath(r.routePath) }));
const linkReport = apiCalls.map(call => {
  const norm = normalizePath(call.url);
  const match = normalizedRoutes.find(r => r.norm && norm.includes(r.norm.replace(/^\/?(api\/)?/, '')));
  return { ...call, matched: !!match, matchedRoute: match ? match.routePath : '' };
});

// ---------- 4b. shared-package cross-app usage matrix ----------
// For every file inside packages/* (e.g. packages/shared), figure out which
// consuming apps (web / desktop / mobile / backend / website / ...) actually
// import it, directly or via the package's own index re-export chain.
const appWorkspaceNames = workspaces
  .filter(w => !w.dir.includes(`${path.sep}packages${path.sep}`))
  .map(w => w.name);

function appOwnerOf(file) {
  const ws = workspaces.find(w => file.startsWith(w.dir + path.sep));
  return ws && !ws.dir.includes(`${path.sep}packages${path.sep}`) ? ws.name : null;
}

// BFS outward from each shared file through the usage graph to find every
// app that eventually pulls it in (covers "app -> index.js -> file" chains).
function appsThatUse(file) {
  const seen = new Set();
  const queue = [file];
  const foundApps = new Set();
  while (queue.length) {
    const cur = queue.shift();
    if (seen.has(cur)) continue;
    seen.add(cur);
    const owner = appOwnerOf(cur);
    if (owner) foundApps.add(owner);
    const importers = usedBy.get(cur);
    if (importers) importers.forEach(imp => queue.push(imp));
  }
  return foundApps;
}

const sharedFiles = uniqueFiles.filter(f => f.includes(`${path.sep}packages${path.sep}`));
const sharedMatrixRows = sharedFiles.map(f => {
  const usedByApps = appsThatUse(f);
  const row = { file: path.relative(REPO_ROOT, f).replace(/\\/g, '/') };
  appWorkspaceNames.forEach(name => { row[name] = usedByApps.has(name) ? 'YES' : ''; });
  row.usedByAnyApp = usedByApps.size > 0 ? 'YES' : 'NO - unused by all apps';
  return row;
});

// ---------- 5. orphan detection ----------
const orphans = uniqueFiles.filter(f => !isEntryPoint(f) && usedBy.get(f).size === 0
  && !frontendPages.some(p => p.file === f) && !backendRoutes.some(r => r.file === f));

// 5b. For each orphan candidate, check if its filename appears as a plain
// STRING anywhere else in the codebase (not just as an import/require).
// This catches patterns the static import-graph can't see, e.g. Electron's
// webPreferences: { preload: path.join(__dirname, 'preload.js') } — the
// file is genuinely wired, just not via a JS import statement.
function findIndirectStringReferences(orphanFile) {
  const base = path.basename(orphanFile); // e.g. "preload.js"
  const baseNoExt = path.basename(orphanFile, path.extname(orphanFile)); // e.g. "preload"
  const hits = [];
  uniqueFiles.forEach(other => {
    if (other === orphanFile) return;
    const content = fileMeta.get(other)?.raw || '';
    // look for the filename (with extension) as a quoted/plain string, e.g. 'preload.js'
    if (content.includes(`'${base}'`) || content.includes(`"${base}"`) || content.includes('`' + base + '`')
      || content.includes(`'${baseNoExt}'`) || content.includes(`"${baseNoExt}"`)) {
      hits.push(path.relative(REPO_ROOT, other).replace(/\\/g, '/'));
    }
  });
  return hits;
}

const orphansWithIndirectCheck = orphans.map(f => {
  const hits = findIndirectStringReferences(f);
  return { file: f, indirectHits: hits };
});

// ---------- 6. write reports ----------
fs.mkdirSync(OUT_DIR, { recursive: true });

function toCSV(rows, headers) {
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [headers.join(','), ...rows.map(r => headers.map(h => esc(r[h])).join(','))].join('\n');
}

const inventoryRows = uniqueFiles.map(f => {
  const meta = fileMeta.get(f);
  return {
    file: path.relative(REPO_ROOT, f).replace(/\\/g, '/'),
    workspace: (workspaces.find(w => f.startsWith(w.dir + path.sep)) || {}).name || '',
    category: categoryFor(f),
    purpose: guessPurpose(f, meta.raw),
    importedByCount: usedBy.get(f).size,
    isEntryOrRoute: isEntryPoint(f) || frontendPages.some(p => p.file === f) || backendRoutes.some(r => r.file === f),
    importedBy: Array.from(usedBy.get(f)).map(x => path.relative(REPO_ROOT, x).replace(/\\/g, '/')).join(' | '),
  };
});

fs.writeFileSync(path.join(OUT_DIR, 'file-inventory.csv'),
  toCSV(inventoryRows, ['file', 'workspace', 'category', 'purpose', 'importedByCount', 'isEntryOrRoute', 'importedBy']));

fs.writeFileSync(path.join(OUT_DIR, 'orphan-files.csv'),
  toCSV(orphansWithIndirectCheck.map(o => ({
    file: path.relative(REPO_ROOT, o.file).replace(/\\/g, '/'),
    purpose: guessPurpose(o.file, fileMeta.get(o.file).raw),
    possibleIndirectReference: o.indirectHits.length ? 'YES - verify manually' : '',
    referencedAsStringIn: o.indirectHits.join(' | '),
  })),
    ['file', 'purpose', 'possibleIndirectReference', 'referencedAsStringIn']));

fs.writeFileSync(path.join(OUT_DIR, 'frontend-pages.csv'),
  toCSV(frontendPages.map(p => ({ ...p, file: path.relative(REPO_ROOT, p.file).replace(/\\/g, '/') })),
    ['workspace', 'routePath', 'file']));

fs.writeFileSync(path.join(OUT_DIR, 'backend-routes.csv'),
  toCSV(backendRoutes.map(r => ({ ...r, file: path.relative(REPO_ROOT, r.file).replace(/\\/g, '/'), mountUnknown: r.mountUnknown ? 'YES - prefix not found, path may be incomplete' : '' })),
    ['workspace', 'method', 'routePath', 'file', 'mountUnknown']));

fs.writeFileSync(path.join(OUT_DIR, 'api-link-report.csv'),
  toCSV(linkReport.map(r => ({ ...r, file: path.relative(REPO_ROOT, r.file).replace(/\\/g, '/') })),
    ['file', 'url', 'matched', 'matchedRoute']));

fs.writeFileSync(path.join(OUT_DIR, 'broken-imports.csv'),
  toCSV(brokenImports.map(b => ({ file: path.relative(REPO_ROOT, b.file).replace(/\\/g, '/'), specifier: b.specifier })),
    ['file', 'specifier']));

fs.writeFileSync(path.join(OUT_DIR, 'shared-usage-matrix.csv'),
  toCSV(sharedMatrixRows, ['file', ...appWorkspaceNames, 'usedByAnyApp']));

const unmatchedCalls = linkReport.filter(r => !r.matched);
const uncalledRoutes = normalizedRoutes.filter(r => !linkReport.some(c => c.matched && c.matchedRoute === r.routePath));

const summary = `# Monorepo Audit Summary
Generated: ${new Date().toISOString()}

## Workspaces detected
${workspaces.map(w => `- **${w.name}** (${w.type}) — ${path.relative(REPO_ROOT, w.dir)}`).join('\n') || '- none found'}

## File inventory
- Total code files scanned: ${uniqueFiles.length}
- See \`file-inventory.csv\` for every file: purpose, category, who imports it.

## Orphan files (not imported anywhere, not an entry point/page/route)
- Count: ${orphans.length}
- See \`orphan-files.csv\`. **Review manually before deleting** — path-alias imports
  (e.g. \`@/services/Api\`) or dynamic \`require(variable)\` calls won't be detected here.

## Frontend pages found: ${frontendPages.length}
See \`frontend-pages.csv\`.

## Backend routes found: ${backendRoutes.length}
See \`backend-routes.csv\`.

## 🔴 Broken imports (imports pointing to files that don't exist)
- Count: ${brokenImports.length}
- Full list in \`broken-imports.csv\`. These are the highest-priority fixes — a broken
  import means the app will crash (or silently fail to bundle) the moment that code path runs.
${brokenImports.length ? brokenImports.slice(0, 30).map(b =>
  `- \`${b.specifier}\` imported from ${path.relative(REPO_ROOT, b.file).replace(/\\/g, '/')}`).join('\n') : '- None found. 🎉'}

## packages/shared cross-app usage matrix
- Total files inside \`packages/\`: ${sharedFiles.length}
- Files NOT used by ANY app (dead shared code): ${sharedMatrixRows.filter(r => r.usedByAnyApp.startsWith('NO')).length}
- Full breakdown (which of web/desktop/mobile/backend actually uses each shared file)
  in \`shared-usage-matrix.csv\` — open in Excel, this is the clearest way to see if your
  "shared" package is actually shared or if some files are secretly only used by one app
  (or by none, meaning the migration from local files was incomplete or the file is dead).

## Frontend → Backend link check
- Total API calls found in frontend code: ${apiCalls.length}
- Calls with NO matching backend route (possible broken/dead link): ${unmatchedCalls.length}
- Backend routes never called from this frontend workspace (may be used by mobile, or unused): ${uncalledRoutes.length}
- Full detail in \`api-link-report.csv\`.

${unmatchedCalls.length ? '### ⚠️ Unmatched frontend API calls (check these first)\n' +
  unmatchedCalls.slice(0, 30).map(c => `- \`${c.url}\` called from ${path.relative(REPO_ROOT, c.file).replace(/\\/g, '/')}`).join('\n') : ''}

## Known blind spots (please read before trusting this 100%)
- Path-alias imports (e.g. \`@/components/Button\`) are NOT resolved unless they match an
  internal workspace package name — if your web app uses \`@/\` aliases pointing into its
  own \`src\`, those imports won't count as "usage" and files may show as false orphans.
  Fix: tell me your \`tsconfig.json\` / \`jsconfig.json\` paths mapping and I'll add alias support.
- API link matching is string-based (URL vs route path), not a real router simulation —
  double check anything marked unmatched before assuming it's broken.
- Mobile (React Native) API calls often use a central \`api.js\`/axios instance with a base
  URL variable, so some calls may show fewer results than expected — check \`services/\` files
  directly for those.
- Dynamically constructed import/require paths (built from variables at runtime) are invisible
  to static analysis like this by design — no static tool can fully catch these.
`;

fs.writeFileSync(path.join(OUT_DIR, 'SUMMARY.md'), summary);

console.log('✅ Audit complete. Reports written to:', OUT_DIR);
console.log(`   - SUMMARY.md            (read this first)`);
console.log(`   - file-inventory.csv    (${inventoryRows.length} files)`);
console.log(`   - orphan-files.csv      (${orphans.length} files)`);
console.log(`   - frontend-pages.csv    (${frontendPages.length} pages)`);
console.log(`   - backend-routes.csv    (${backendRoutes.length} routes)`);
console.log(`   - api-link-report.csv   (${apiCalls.length} frontend API calls checked)`);
console.log(`   - broken-imports.csv    (${brokenImports.length} broken imports found)`);
console.log(`   - shared-usage-matrix.csv (${sharedFiles.length} shared package files checked)`);