import fs from 'fs';
import path from 'path';

const distPath = path.join(process.cwd(), 'dist');
const indexPath = path.join(distPath, 'index.html');

if (fs.existsSync(indexPath)) {
  const timestamp = new Date().toISOString();
  let html = fs.readFileSync(indexPath, 'utf8');
  
  // Replace the placeholder with actual timestamp
  html = html.replace('<!-- BUILD_TIMESTAMP -->', timestamp);
  
  fs.writeFileSync(indexPath, html);
  console.log(`✅ Injected timestamp: ${timestamp}`);
} else {
  console.log('❌ index.html not found in dist folder');
}
