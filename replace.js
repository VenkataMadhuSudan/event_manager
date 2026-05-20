const fs = require('fs');
const path = require('path');

const replacements = [
  { regex: /purple-600/g, replacement: 'sky-600' },
  { regex: /indigo-600/g, replacement: 'sky-600' },
  { regex: /purple-500/g, replacement: 'sky-500' },
  { regex: /indigo-500/g, replacement: 'sky-500' },
  { regex: /pink-500/g, replacement: 'sky-500' },
  { regex: /purple-400/g, replacement: 'sky-400' },
  { regex: /indigo-400/g, replacement: 'sky-400' },
  { regex: /purple-300/g, replacement: 'sky-300' },
  { regex: /indigo-300/g, replacement: 'sky-300' },
  { regex: /purple-200/g, replacement: 'sky-200' },
  { regex: /indigo-200/g, replacement: 'sky-200' },
  { regex: /pink-200/g, replacement: 'sky-200' },
  { regex: /purple-100/g, replacement: 'sky-100' },
  { regex: /indigo-100/g, replacement: 'sky-100' },
  { regex: /purple-950/g, replacement: 'sky-950' },
  { regex: /indigo-950/g, replacement: 'sky-950' },
  { regex: /green-500/g, replacement: 'blue-500' },
  { regex: /green-400/g, replacement: 'blue-400' }
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      for (const { regex, replacement } of replacements) {
        content = content.replace(regex, replacement);
      }
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(path.join(__dirname, 'app'));
processDirectory(path.join(__dirname, 'components'));
console.log("Done.");
