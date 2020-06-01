#!/usr/bin/env node
console.log('NPM dependency tree validation');

const fs = require('fs');
const path = require('path');

const asyncExec = require('util').promisify(require('child_process').exec);
async function run(cmd) {
  const {stdout} = await asyncExec(cmd);
  return stdout;
}


const versions = require('../versions.json');
const pkg = {
  "name": "no-name",
  "license": "UNLICENSED",
  "devDependencies": {},
  dependencies: {
    "@polymer/polymer": "^3.2.0",
    "@webcomponents/webcomponentsjs": "^2.2.0"
  }
}
Object.entries(versions.core)
  .filter(e => e[1].npmName && e[1].javaVersion)
  .reduce((p, e) => {
    p[e[1].npmName] = (e[1].npmVersion || e[1].jsVersion)
    return p
  }, pkg.dependencies);
Object.entries(versions.vaadin)
  .filter(e => e[1].npmName && e[1].javaVersion)
  .reduce((p, e) => {
    p[e[1].npmName] = (e[1].npmVersion || e[1].jsVersion);
    return p;
  }, pkg.dependencies);

const curDir = process.cwd();
const tmpDir = path.resolve('target/validate-version');
fs.mkdirSync(tmpDir, { recursive: true });
process.chdir(tmpDir);

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 1));
if (fs.existsSync('package-lock.json')){
  fs.unlinkSync('package-lock.json');
} 

console.log('Running npm install ...');
run('npm install')
.then(() => console.log("Running npm ls ..."))
.then(() => run('npm ls'))
.then(out => {
  process.cwd(curDir);
  const packages = {};
  const errors = [];
  out.split(/\n[^@\w]+/)
  .forEach(l => {
    const r = /^(.+)@(\d[^ ]+)/.exec(l);
    if (r) {
      if (packages[r[1]] && packages[r[1]] !== r[2]) {
        errors.push(`>> ERROR found duplicated dependency ${r[1]} ${packages[r[1]]} !== ${r[2]}`);
      } else {
        packages[r[1]] = r[2];
      }
    }
  });
  return errors;
}).then(errors => {
  if (errors.length) {
    console.error(`
    !!!!!!!!!!!!!
     ${errors.join('\n     ')}

    TIP: next commands might help to fix the issue:
    npm ls | grep "package_name"
    npm dist-tag add package_name@x.x.x latest
    !!!!!!!!!!!!!\n`);
    process.exit(1);
  }
  console.log("NPM dependency tree is OK");
});
