const fs = require('fs');
const j = require('jscodeshift');
const transformer = require('./transform.js').default;

const fileInfo = {
  path: 'src/pages/StockMovementsPage.jsx',
  source: fs.readFileSync('src/pages/StockMovementsPage.jsx', 'utf8')
};

const api = {
  jscodeshift: j
};

const res = transformer(fileInfo, api);
console.log(res);
