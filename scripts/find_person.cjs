const fs = require('fs');
const c = fs.readFileSync('src/components/TransactionFormModal.tsx', 'utf8');
const lines = c.split('\n');
lines.forEach((l, i) => {
  const t = l.trim();
  if (t.includes('person') || t.includes('filter') || t.includes('suggest') || t.includes('includes') || t.includes('toLowerCase')) {
    console.log((i+1) + ': ' + t.slice(0, 120));
  }
});
