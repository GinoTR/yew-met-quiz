const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const js = fs.readFileSync('script.js', 'utf8');

const idRegex = /getElement\(['"]([^'"]+)['"]\)/g;
let m;
const ids = new Set();
while ((m = idRegex.exec(js)) !== null) {
  ids.add(m[1]);
}

console.log('Checking JS getElement IDs against HTML...');
let missing = 0;
ids.forEach(id => {
  if (!html.includes('id="' + id + '"')) {
    console.log('MISSING ID in HTML:', id);
    missing++;
  }
});
if (missing === 0) {
  console.log('All JS getElement IDs found in HTML ✅');
}
