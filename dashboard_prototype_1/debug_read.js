const fs = require('fs');
const path = 'c:/Users/User/Documents/INDRA_SIH/dashboard_prototype_2/components/dashboard/AnalysisView.tsx';
const c = fs.readFileSync(path, 'utf8');
const lines = c.split('\n');
for (let i = 295; i < 390; i++) {
  console.log((i + 1) + ':', lines[i]);
}