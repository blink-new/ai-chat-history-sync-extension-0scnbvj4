#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function packageExtension() {
  console.log('📦 Packaging Chrome Extension...');
  
  try {
    // Step 1: Build the React app
    console.log('🔨 Building React app...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // Step 2: Create extension directory
    const extensionDir = path.join(__dirname, '..', 'extension-build');
    if (fs.existsSync(extensionDir)) {
      fs.rmSync(extensionDir, { recursive: true, force: true });
    }
    fs.mkdirSync(extensionDir, { recursive: true });
    
    // Step 3: Copy built React app
    console.log('📁 Copying built files...');
    const distDir = path.join(__dirname, '..', 'dist');
    if (fs.existsSync(distDir)) {
      copyDirectory(distDir, extensionDir);
    }
    
    // Step 4: Copy extension-specific files
    const extensionFiles = [
      'public/manifest.json',
      'public/background.js',
      'public/content-chatgpt.js',
      'public/content-claude.js',
      'public/content-gemini.js',
      'public/content-grok.js',
      'public/options.html',
      'public/options.js',
      'public/icon-16.png',
      'public/icon-48.png',
      'public/icon-128.png',
      'public/logo.jpeg'
    ];
    
    extensionFiles.forEach(file => {
      const sourcePath = path.join(__dirname, '..', file);
      const destPath = path.join(extensionDir, path.basename(file));
      
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`✅ Copied ${file}`);
      } else {
        console.warn(`⚠️  File not found: ${file}`);
      }
    });
    
    // Step 5: Update manifest.json for production
    const manifestPath = path.join(extensionDir, 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      
      // Update version if needed
      manifest.version = process.env.EXTENSION_VERSION || manifest.version;
      
      // Ensure all required files are referenced
      manifest.action.default_popup = 'index.html';
      
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      console.log('✅ Updated manifest.json');
    }
    
    // Step 6: Create installation guide
    const guideContent = `# AI Chat History Sync Chrome Extension

## Installation Instructions

### For Development/Testing:
1. Open Chrome and navigate to chrome://extensions/
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" button
4. Select the 'extension-build' folder
5. The extension should now appear in your extensions list

### For Chrome Web Store:
1. Use the generated ZIP file: ai-chat-sync-extension.zip
2. Upload to Chrome Web Store Developer Dashboard

## Usage

1. Click the extension icon in your Chrome toolbar
2. Sign in to your account
3. Visit ChatGPT, Claude, Gemini, or Grok
4. The extension will automatically start syncing your conversations

## Features

- ✅ Automatic conversation extraction from ChatGPT, Claude, Gemini, and Grok
- ✅ Cross-platform synchronization
- ✅ Persistent memory layer across all AI platforms
- ✅ Privacy-focused local storage
- ✅ Real-time sync monitoring
- ✅ Context injection for seamless conversations
- ✅ Premium features: Advanced filtering, tagging, export options

## Supported Platforms

- **ChatGPT** (chat.openai.com)
- **Claude** (claude.ai)
- **Google Gemini** (gemini.google.com)
- **Grok** (grok.x.com)

## Privacy & Security

- All data is stored locally on your device
- No data is sent to external servers without your consent
- Conversations are encrypted and secure
- You maintain full control over your data

## Support

For support and feature requests:
- GitHub Issues: https://github.com/your-repo/issues
- Email: support@ai-sync.app

Built with ❤️ using Blink AI
`;
    
    fs.writeFileSync(path.join(extensionDir, 'README.md'), guideContent);
    
    // Step 7: Create ZIP file for Chrome Web Store
    await createZipFile(extensionDir);
    
    console.log('🎉 Extension packaging complete!');
    console.log('📁 Extension files: extension-build/');
    console.log('📦 ZIP file: ai-chat-sync-extension.zip');
    console.log('🚀 Ready for Chrome Web Store or local installation!');
    
    // Step 8: Display next steps
    console.log('\\n📋 Next Steps:');
    console.log('1. 🧪 Test locally: Load extension-build/ folder in chrome://extensions/');
    console.log('2. 🌐 Chrome Web Store: Upload ai-chat-sync-extension.zip');
    console.log('3. 📖 Read CHROME_STORE_GUIDE.md for detailed publishing instructions');
    
  } catch (error) {
    console.error('❌ Packaging failed:', error.message);
    process.exit(1);
  }
}

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function createZipFile(extensionDir) {
  const zipPath = path.join(__dirname, '..', 'ai-chat-sync-extension.zip');
  
  try {
    // Try using system zip command first
    execSync(`cd \"${extensionDir}\" && zip -r \"${zipPath}\" .`, { stdio: 'pipe' });
    console.log('✅ ZIP created using system zip command');
  } catch (error) {
    // Fallback to archiver if available
    try {
      const archiver = require('archiver');
      
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });
      
      return new Promise((resolve, reject) => {
        output.on('close', () => {
          console.log(`✅ ZIP created using archiver: ai-chat-sync-extension.zip (${archive.pointer()} bytes)`);
          resolve();
        });
        
        archive.on('error', reject);
        archive.pipe(output);
        archive.directory(extensionDir, false);
        archive.finalize();
      });
    } catch (archiverError) {
      console.warn('⚠️  Could not create ZIP file automatically');
      console.log('💡 Please manually zip the contents of extension-build/ folder');
      console.log('   Or install archiver: npm install archiver');
    }
  }
}

// Run if called directly
if (require.main === module) {
  packageExtension().catch(console.error);
}

module.exports = { packageExtension };