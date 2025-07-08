const fs = require('fs');
const path = require('path');

function removeDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(`Removed ${dirPath}`);
  }
}

// Clean dist directory
const distPath = path.join(__dirname, 'dist');
removeDir(distPath);
console.log('Dist directory cleaned');
