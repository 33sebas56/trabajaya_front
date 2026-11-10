const fs=require('node:fs');const path=require('node:path');
let ts;try{ts=require('typescript');}catch{console.error('Solo para estas pruebas: npm install --no-save --package-lock=false typescript');process.exit(1);}
const dir=path.resolve(__dirname,'../../src'),out=path.join(__dirname,'artifacts');fs.mkdirSync(out,{recursive:true});
let output='const modules={};const cache={};function require(name){if(cache[name])return cache[name].exports;const module={exports:{}};cache[name]=module;modules[name](module,module.exports,require);return module.exports;}\n';
for(const file of fs.readdirSync(dir).filter(f=>f.endsWith('.js'))){const source=fs.readFileSync(path.join(dir,file),'utf8');const result=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,allowJs:true}});output+=`modules['./${file}']=function(module,exports,require){\n${result.outputText}\n};\n`;}
output+='require("./app.js");';fs.writeFileSync(path.join(out,'browser-bundle.js'),output);
