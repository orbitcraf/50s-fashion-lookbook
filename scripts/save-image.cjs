const fs=require('node:fs');const path=require('node:path');
let sharp;try{sharp=require('sharp');}catch{sharp=require('C:/Users/mmint/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');}
const [source,id]=process.argv.slice(2);if(!source||!/^\d{3}$/.test(id))throw new Error('Usage: node scripts/save-image.cjs source.png 001');
const directory=path.resolve(__dirname,'../assets/images');fs.mkdirSync(directory,{recursive:true});
sharp(source).resize(960,1200,{fit:'contain',background:'#f3f0e9'}).webp({quality:86,effort:5}).toFile(path.join(directory,`outfit-${id}.webp`)).then(info=>console.log(JSON.stringify({id,width:info.width,height:info.height,bytes:info.size}))).catch(error=>{console.error(error.message);process.exitCode=1;});
