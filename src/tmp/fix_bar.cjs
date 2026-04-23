const fs = require('fs');
const path = 'c:/Users/wena3/OneDrive/Documents/Antigravity/Shinsokagaku/src/components/LuckRhythm.tsx';
let content = fs.readFileSync(path, 'utf8');

// Fix the bar height and class
// Target: <div className="bar" style={{ height: `${(points[posIdx].y / 200) * 100}%` }}></div>
// Replacement: <div className={`bar ${status.class}`} style={{ height: `${((180 - points[posIdx].y + 50) / 180) * 100}%` }}></div>

content = content.replace(
  /<div className="bar" style=\{\{\s+height:\s+\`\$\{?\(?points\[posIdx\]\.y\s+\/\s+200\)\s+\*\s+100\}%\`\s+\}\}\s+><\/div>/,
  '<div className={`bar ${status.class}`} style={{ height: `${((180 - points[posIdx].y + 50) / 180) * 100}%` }}></div>'
);

fs.writeFileSync(path, content);
console.log("Successfully updated LuckRhythm.tsx bar visuals.");
