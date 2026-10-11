const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'data/outfits.js'),'utf8'),context);const outfits=context.window.OUTFITS;
assert.equal(outfits.length,100);assert.equal(new Set(outfits.map(o=>o.id)).size,100);assert.equal(new Set(outfits.map(o=>o.image)).size,100);
for(const season of ['春','夏','秋','冬'])assert.equal(outfits.filter(o=>o.season.includes(season)).length,25);
for(const [type,count] of [['パンツ',34],['スカート',33],['ワンピース',33]])assert.equal(outfits.filter(o=>o.category.includes(type)).length,count);
let missing=0;
for(const o of outfits){for(const key of ['id','image','title','season','category','tops','bottoms','shoes','colors','price','point','priceItems'])assert.ok(o[key],`${o.id}: missing ${key}`);assert.equal(o.image,`assets/images/outfit-${String(o.id).padStart(3,'0')}.webp`);for(const p of o.priceItems){assert.ok(p.min>0&&p.min<=p.max&&p.max<=10000);assert.ok(Number.isInteger(p.quantity||1));}const sums=['min','max'].map(k=>o.priceItems.reduce((n,p)=>n+p[k]*(p.quantity||1),0));assert.equal(o.price,`合計目安 約${sums[0].toLocaleString('ja-JP')}〜${sums[1].toLocaleString('ja-JP')}円`);if(!fs.existsSync(path.join(root,o.image)))missing++;}
if(!process.argv.includes('--allow-missing-images'))assert.equal(missing,0,`${missing} images missing`);
console.log(`PASS: 100 unique outfits; seasons 25 each; types 34/33/33; valid price ranges; ${100-missing}/100 images.`);
