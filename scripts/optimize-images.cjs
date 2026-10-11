const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
let sharp;
try { sharp = require('sharp'); }
catch { sharp = require('C:/Users/mmint/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp'); }

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'assets/images');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backup = path.join(root, 'backups', `images-${stamp}`);
const files = fs.readdirSync(source).filter(file => /^outfit-\d{3}\.webp$/.test(file)).sort();
const hash = buffer => crypto.createHash('sha256').update(buffer).digest('hex');

(async () => {
  if (files.length !== 100) throw new Error('Expected 100 outfit images');
  fs.mkdirSync(backup, { recursive: true });
  const originals = files.map(file => {
    const buffer = fs.readFileSync(path.join(source, file));
    fs.writeFileSync(path.join(backup, file), buffer, { flag: 'wx' });
    return { file, bytes: buffer.length, sha256: hash(buffer) };
  });
  fs.writeFileSync(path.join(backup, 'originals.json'), JSON.stringify(originals, null, 2));
  // Complete and verify every backup before replacing any public asset.
  for (const original of originals) {
    if (hash(fs.readFileSync(path.join(backup, original.file))) !== original.sha256) {
      throw new Error(`Backup verification failed: ${original.file}`);
    }
  }
  const results = [];
  for (const original of originals) {
    const input = fs.readFileSync(path.join(backup, original.file));
    const metadata = await sharp(input).metadata();
    const encoded = await sharp(input).webp({ quality: 82, effort: 6, smartSubsample: true }).toBuffer();
    const output = encoded.length < input.length ? encoded : input;
    const checked = await sharp(output).metadata();
    if (checked.width !== metadata.width || checked.height !== metadata.height || checked.format !== 'webp') {
      throw new Error(`Unexpected image dimensions or format: ${original.file}`);
    }
    fs.writeFileSync(path.join(source, original.file), output);
    results.push({ file: original.file, before: input.length, after: output.length, sha256: hash(output) });
  }
  const before = results.reduce((sum, item) => sum + item.before, 0);
  const after = results.reduce((sum, item) => sum + item.after, 0);
  const report = { backup, quality: 82, width: 960, height: 1200, count: results.length, before, after, savedPercent: Number(((1 - after / before) * 100).toFixed(1)), images: results };
  fs.writeFileSync(path.join(backup, 'optimization.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, images: undefined }));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
