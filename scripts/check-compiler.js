/**
 * Guards against a React Compiler crash (Phase 7): in a component where a
 * value may be undefined (`existing?: Shift`), writing `existing!.x` tells
 * the compiler it always exists. The compiler can then read `existing.x`
 * on every render to decide what to redraw, which crashes when it is
 * undefined (e.g. an "Add" form). This compiles each screen with the
 * compiler and fails if a render-time check reads a property of a value
 * the source asserts with `!.`.
 *
 * Fix a hit by guarding (`existing ? existing.x : …`) or by moving the code
 * that needs the value into a component that receives it as required.
 * Run: npm run check:compiler
 */
const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

const files = [];
(function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      if (name !== '__tests__') walk(full);
    } else if (full.endsWith('.tsx')) {
      files.push(full);
    }
  }
})(path.join(__dirname, '..', 'src'));

let problems = 0;
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const asserted = new Set([...source.matchAll(/\b(\w+)!\./g)].map((m) => m[1]));
  if (asserted.size === 0) continue;
  const { code } = babel.transformSync(source, {
    filename: file,
    babelrc: false,
    configFile: false,
    presets: [['@babel/preset-typescript', { isTSX: true, allExtensions: true }]],
    plugins: [['babel-plugin-react-compiler', {}], '@babel/plugin-syntax-jsx'],
  });
  const hits = new Set();
  for (const m of code.matchAll(/\$\[\d+\] !== ([a-zA-Z_]\w*)\.(\w+)/g)) {
    if (asserted.has(m[1])) hits.add(`${m[1]}.${m[2]}`);
  }
  if (hits.size) {
    problems += 1;
    console.error(`${path.relative(process.cwd(), file)}: read on every render without a check: ${[...hits].join(', ')}`);
  }
}
if (problems) {
  console.error(`\n${problems} file(s) can crash under the React Compiler. See the note at the top of scripts/check-compiler.js.`);
  process.exit(1);
}
console.log(`React Compiler check: ${files.length} files, no unchecked reads.`);
