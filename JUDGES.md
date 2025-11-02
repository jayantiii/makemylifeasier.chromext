# Extension Testing Instructions for Judges

This guide will help you test the Highlight to Enlight Chrome extension.

---

## Prerequisites

1. **Chrome Browser**: Version 138+ (Chrome Built-in AI requires recent Chrome versions)
2. **Enable Developer Mode**: Required to load the extension

---

## Step 1: Enable Chrome Built-in AI Flags

The extension uses Chrome's built-in AI Writer API, which requires experimental flags to be enabled:

1. Open Chrome and navigate to `chrome://flags/`
2. Search for `writer-api-for-gemini-nano`
3. Set it to **"Enabled"**
4. **Important**: Restart Chrome completely for the flags to take effect

---

## Step 2: Load the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in the top right)
3. Click **"Load unpacked"**
4. Select the folder containing the extension files (the folder with `manifest.json`, `popup.html`, `popup.js`, etc.)
5. The extension should now appear in your extensions list

---

## Step 3: Pin the Extension

1. Click the puzzle icon (extensions menu) in Chrome's toolbar
2. Find "Highlight to Enlight" or "Text to LLM"
3. Click the pin icon to keep it visible in your toolbar

---

## Step 4: Configure System Prompt (First Time Setup)

1. Click the extension icon in the toolbar
2. Click the **"Settings"** button
3. In the system prompt textarea, enter your profile information and writing preferences
   - Example: "You are a professional writing assistant for [Your Name]. [Your background, skills, writing style preferences]"
4. Click **"Save"**
5. You should see a success message

**Note**: If you skip this step, you'll be prompted to set it when you first try to use the extension.

---

## Step 5: Test Text Selection

### Test 1: Basic Text Selection

1. Open any webpage (e.g., a job posting on LinkedIn, an article, or your email)
2. Highlight/select any text on the page
3. Click the extension icon
4. You should see the selected text displayed in the extension popup

### Test 2: Text Selection from Input Fields

1. Open a page with a text input field (like Gmail compose)
2. Type some text in the input field
3. Select part of the text you typed
4. Click the extension icon
5. Verify the selected text appears in the extension

### Test 3: Refresh Selection Feature

1. Select some text on a page
2. Click the extension icon
3. Change the selection on the webpage (select different text)
4. Click the **"Refresh Selection"** button in the extension
5. Verify the new selection appears

---

## Step 6: Test AI Writing Features

### Test 1: Generate Cover Letter

1. Go to a job posting website (LinkedIn, Indeed, etc.)
2. Highlight the job description
3. Click the extension icon
4. In the "Custom Prompt" field, enter: "Write a cover letter for this position"
5. Click **"SEND TO LLM"**
6. Wait for the AI response (should appear in 5-15 seconds)
7. Verify you get a cover letter response

### Test 2: Fix Email

1. Open Gmail or any email client (or create a test email)
2. Type a poorly written email
3. Highlight the email text
4. Click the extension icon
5. In "Custom Prompt", enter: "Fix the grammar and make this more professional"
6. Click **"SEND TO LLM"**
7. Verify you get an improved version

### Test 3: Custom Prompt Only

1. Click the extension icon
2. Leave the selection empty (or no text selected)
3. In "Custom Prompt", enter: "Write a professional email requesting a meeting"
4. Click **"SEND TO LLM"**
5. Verify you get a generated email

### Test 4: Selected Text Only

1. Highlight any text on a webpage
2. Click the extension icon
3. Leave "Custom Prompt" empty
4. Click **"SEND TO LLM"**
5. Verify you get a response based on the selected text

---

## Step 7: Test Copy Functionality

1. After getting an AI response, click the **"Copy"** button
2. Open a text editor or email composer
3. Paste (Ctrl+V / Cmd+V)
4. Verify the response text was copied correctly

---

## Step 8: Test Settings

1. Click the extension icon
2. Click **"Settings"**
3. Modify the system prompt text
4. Click **"Save"**
5. Verify the settings panel closes and you see a success message
6. Open settings again and verify your changes were saved

### Test Cancel

1. Click **"Settings"**
2. Modify the system prompt text
3. Click **"Cancel"**
4. Reopen settings
5. Verify your changes were NOT saved (should show previous saved prompt)

---

## Step 9: Test Error Handling

### Test 1: No Text Selected

1. Click the extension icon without selecting any text
2. Leave "Custom Prompt" empty
3. Click **"SEND TO LLM"**
4. Verify you see an error message: "Please enter a custom prompt or select some text."

### Test 2: Chrome AI Not Available (Fallback)

If Chrome AI flags are not enabled or not working:

1. The extension should show a fallback response
2. You'll see a message like: "Chrome Built-in AI is not available..."
3. The fallback should still provide a template/example response

---

## Step 10: Test Across Different Websites

Test the extension on various websites to verify text selection works everywhere:

1. **LinkedIn**: Job postings, articles
2. **Gmail**: Email composition
3. **GitHub**: Code comments, README files
4. **Google Docs**: (if accessible)
5. **News websites**: Articles
6. **Social media**: Twitter/X, Facebook posts

---

## Expected Behavior Summary

**What Should Work:**
- Text selection from any webpage
- AI-generated responses using Chrome's Writer API
- Custom prompts
- System prompt customization and saving
- Copy functionality
- Settings panel toggle
- Refresh selection button

**Known Limitations:**
- Requires Chrome 138+ and Chrome flags to be enabled
- Chrome Built-in AI is experimental and may not be available in all regions
- Cross-origin iframes may not allow text selection
- Some complex web applications might have selection quirks

---

## Troubleshooting

**If the extension shows "Chrome Built-in AI not available":**
- Verify Chrome flags are enabled: `chrome://flags/` → search "writer-api-for-gemini-nano"
- Make sure Chrome was restarted after enabling flags
- Check Chrome version (needs 138+)
- Try reloading the extension in `chrome://extensions/`

**If text selection doesn't work:**
- Try the "Refresh Selection" button
- Refresh the webpage and try again
- Some websites use complex layouts that may require page refresh

**If AI responses are slow:**
- This is normal - Chrome's AI API can take 5-15 seconds
- First request may be slower as the model loads

---

## Contact

If you encounter any issues during testing or have questions, please refer to the project README or contact the developer.

Thank you for testing Highlight to Enlight!

