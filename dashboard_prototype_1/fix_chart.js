const fs = require('fs');
const path = 'c:/Users/User/Documents/INDRA_SIH/dashboard_prototype_2/components/dashboard/AnalysisView.tsx';
const c = fs.readFileSync(path, 'utf8');

const searchStr = 'timeSeriesData.yTicks.map((tick, i) => (';
const replaceStr = 'timeSeriesData.yTicks.map((tick, i) => {';

const c2 = c.replace(searchStr, replaceStr);
fs.writeFileSync('c:/Users/User/Documents/INDRA_SIH/dashboard_prototype_2/components/dashboard/AnalysisView.tsx', c2);
console.log('Fixed map arrow');
