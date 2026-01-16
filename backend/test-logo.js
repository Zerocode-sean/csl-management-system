const fs = require('fs');
const path = require('path');

console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);

// Try multiple possible logo locations
const possibleLogoPaths = [
  path.join(process.cwd(), 'logo', 'logo.jpg'),           // Docker: /app/logo/logo.jpg
  path.join(process.cwd(), '..', 'logo', 'logo.jpg'),     // Parent directory
  path.join(__dirname, '..', 'logo', 'logo.jpg'),         // Relative to this script
];

console.log('\nChecking logo paths:');
for (const logoPath of possibleLogoPaths) {
  console.log(`\nPath: ${logoPath}`);
  console.log(`Exists: ${fs.existsSync(logoPath)}`);
  
  if (fs.existsSync(logoPath)) {
    try {
      const logoBuffer = fs.readFileSync(logoPath);
      const logoBase64 = `data:image/jpeg;base64,${logoBuffer.toString('base64')}`;
      console.log('✅ Logo loaded successfully!');
      console.log(`Base64 length: ${logoBase64.length} characters`);
      console.log(`First 100 chars: ${logoBase64.substring(0, 100)}...`);
      break;
    } catch (error) {
      console.log('❌ Error reading logo:', error.message);
    }
  }
}
