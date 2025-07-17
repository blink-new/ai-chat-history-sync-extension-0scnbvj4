# Testing the Chrome Extension

## Current Status
The extension is currently showing step 2/4 in the web preview because Blink authentication is already active. This is expected behavior - in the actual Chrome extension, it would start from step 1.

## How to Test in Chrome Browser

### Step 1: Publish and Download
1. Click the **"Publish"** button in Blink (top right)
2. After publishing completes, click **"Download Code"** 
3. Extract the downloaded ZIP file to a folder on your computer

### Step 2: Build the Extension
1. Open terminal/command prompt in the extracted folder
2. Run: `npm install`
3. Run: `npm run build`
4. This creates a `dist` folder with the built extension

### Step 3: Load in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top right)
3. Click **"Load unpacked"**
4. Select the `dist` folder from step 2
5. The extension should now appear in your extensions list

### Step 4: Test the Extension
1. Click the extension icon in Chrome toolbar
2. You should see the Setup Wizard starting from step 1
3. Complete the authentication flow
4. Visit ChatGPT, Claude, Gemini, or Grok to test extraction

## Expected Behavior in Chrome Extension

### Setup Wizard Flow:
1. **Step 1**: Sign in to get started (actual authentication required)
2. **Step 2**: Welcome screen with platform overview
3. **Step 3**: Grant permissions by visiting each platform
4. **Step 4**: Setup complete

### After Setup:
- Extension monitors visits to AI platforms
- Automatically extracts conversation history
- Syncs data across platforms
- Provides unified conversation view

## Troubleshooting

### If Extension Doesn't Load:
- Check that `manifest.json` is in the `dist` folder
- Ensure all required files are present
- Check Chrome's extension error messages

### If Authentication Fails:
- The extension uses Blink's authentication system
- Make sure you have a Blink account
- Check network connectivity

### If Extraction Doesn't Work:
- Visit the actual AI platform websites
- Check that content scripts are injecting properly
- Look for console errors in Chrome DevTools

## Development vs Production

- **Web Preview**: Shows demo data and simulated behavior
- **Chrome Extension**: Real extraction from actual AI platforms
- **Authentication**: Web preview uses existing Blink auth, extension requires fresh sign-in

## Next Steps

Once you've tested the basic functionality, you can:
1. Test conversation extraction on each platform
2. Verify data persistence across browser sessions
3. Test the sync functionality
4. Explore premium features if implemented

The extension is designed to work seamlessly across all supported AI platforms while keeping your data private and local.