#!/usr/bin/env node
console.log('NPM dependency tree validation');

const fs = require('fs');
const asyncExec = require('util').promisify(require('child_process').exec);
async function run(cmd) {
  const {stdout} = await asyncExec(cmd);
  return stdout;
}

function clean() {
  try {
    fs.unlinkSync('package.json')
  } catch (error) {
  }
  try {
    fs.unlinkSync('package-lock.json')
  } catch (error) {
  }
  fs.rmdirSync('node_modules', { recursive: true })
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


clean();
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 1));

console.log('Running npm install ...');
run('npm install')
.then(() => console.log("Running npm ls ..."))
.then(() => run('npm ls'))
.then(out => {
  const packages = {};
  out.split(/\n[^@\w]+/)
  .forEach(l => {
    const r = /^(.+)@(\d[^ ]+)/.exec(l);
    if (r) {
      if (packages[r[1]] && packages[r[1]] !== r[2]) {
        console.log(out);
        console.error(`
        !!!!!!!!!!!!!
        >> ERROR found duplicated dependency ${r[1]} ${packages[r[1]]} !== ${r[2]}

        TIP: next commands might help to fix the issue:
        npm ls | grep "${r[1]}"
        npm dist-tag add ${r[1]}@x.x.x latest
        !!!!!!!!!!!!!\n`)
        process.exit(1);
      } else {
        packages[r[1]] = r[2];
      }
    }
  });
  console.log("NPM dependency tree is OK");
  clean();
});
