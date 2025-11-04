# Highlight to Enlight

**Work smart, not harder. Just highlight and let AI do the rest.**

A Chrome extension that brings AI writing assistance directly to any webpage. Simply highlight text and get instant AI-powered responses without switching tabs or managing API keys.

---

## Features

- **Highlight Anywhere**: Select text from any webpage - articles, emails, job postings, or documents
- **Instant AI Responses**: Get AI-powered writing assistance using Chrome's built-in AI
- **Fully Customizable**: **Change the system prompt** to personalize AI responses with your profile, writing style, and preferences
- **Custom Prompts**: Add specific instructions for tailored responses
- **Personalized AI**: Configure your own system prompt with your profile and writing style
- **Easy Copy**: One-click copy functionality for all generated content
- **Zero Setup**: No API keys, no external dependencies - uses Chrome's native AI
- **Works Offline**: Powered by Chrome's built-in AI API

---

## Installation

### Step 1: Clone the Repository

Clone this repository to your local machine:

```bash
git clone https://github.com/[your-username]/chromextension-llm.git
cd chromextension-llm
```

Or download the repository as a ZIP file and extract it.

### Step 2: Enable Chrome Built-in AI

The extension requires Chrome's experimental AI features:

1. Open Chrome and navigate to `chrome://flags/`
2. Search for `writer-api-for-gemini-nano`
3. Set it to **"Enabled"**
4. **Restart Chrome completely** for the flag to take effect

### Step 3: Load the Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in the top right)
3. Click **"Load unpacked"**
4. Select the folder containing the extension files (the cloned/extracted folder)
5. The extension should now appear in your extensions list

### Step 4: Pin the Extension

1. Click the puzzle icon (extensions menu) in Chrome's toolbar
2. Find "Text to LLM" or "Highlight to Enlight"
3. Click the pin icon to keep it visible in your toolbar

---

## Usage

### First Time Setup - Customize Your System Prompt

**The extension is fully customizable!** You can change the system prompt to make AI responses tailored to you:

1. Click the extension icon
2. Click the **"Settings"** button
3. Enter your system prompt (your profile, writing style, preferences)
   - Example: "You are a professional writing assistant for [Your Name]. [Your background, skills, writing style]"
   - You can include your resume, writing preferences, tone, and any specific instructions
4. Click **"Save"**

**You can update your system prompt anytime** - just click Settings and modify it. The saved prompt is used in all AI requests, making every response personalized to your needs.

### Using the Extension

1. **Highlight text** on any webpage (job descriptions, emails, articles, etc.)
2. **Click the extension icon** in your toolbar
3. **Optionally add a custom prompt** (e.g., "Write a cover letter", "Fix grammar", "Make this more professional")
4. **Click "SEND TO LLM"** to get an AI response
5. **Copy the response** using the copy button

---

## Customization

**The extension is fully customizable through the system prompt!** You can:

- Add your personal profile and background
- Set your preferred writing style and tone
- Include specific instructions for how you want responses formatted
- Update it anytime from the Settings panel

The system prompt you set is included in every AI request, ensuring all responses are personalized to your needs. This means cover letters reflect your experience, emails match your communication style, and all writing is tailored to you.

## Examples

### Cover Letters
- Highlight a job description → Enter prompt: "Write a cover letter for this position"
- Get a tailored cover letter based on the job requirements **and your system prompt profile**

### Email Improvement
- Highlight a draft email → Enter prompt: "Fix grammar and make this more professional"
- Get a polished, professional version **matching your writing style**

### Research & Summarization
- Highlight any text → Enter prompt: "Summarize this" or "Explain this in simple terms"
- Get instant summaries or explanations **tailored to your preferences**

### Writing Assistance
- Highlight text → Enter prompt: "Improve clarity and tone"
- Get refined writing with better structure and flow **based on your system prompt settings**

---

## Requirements

- **Chrome Browser**: Version 138+ (for Chrome Built-in AI support)
- **Chrome Flags**: Must enable `writer-api-for-gemini-nano` flag
- No API keys or external services needed

---

## Troubleshooting

### Extension Shows "Chrome Built-in AI not available"

- Verify Chrome flags are enabled: `chrome://flags/` → search "writer-api-for-gemini-nano"
- Make sure Chrome was **completely restarted** after enabling flags
- Check Chrome version (needs 138+)
- Try reloading the extension in `chrome://extensions/`

### Text Selection Not Working

- Try the **"Refresh Selection"** button in the extension
- Refresh the webpage and try again
- Some complex websites may require page refresh

### No System Prompt Set

- Click the **"Settings"** button
- Enter your system prompt and save
- You'll be prompted to set it on first use

### Slow Responses

- First request may be slower (5-15 seconds is normal)
- Chrome's AI API loads the model on first use
- Subsequent requests should be faster

---

## Privacy & Security

- **No API Keys**: Uses Chrome's built-in AI - no external API calls
- **Local Processing**: All AI processing happens locally in Chrome
- **No Data Collection**: Extension doesn't collect or store your data
- **Privacy-First**: Your text and prompts stay on your device

---

## How It Works

1. **Text Selection**: The extension captures selected text from any webpage
2. **Content Assembly**: Combines your system prompt, custom prompt, and selected text
3. **AI Processing**: Sends to Chrome's built-in AI Writer API
4. **Response Display**: Shows the AI-generated response in the popup
5. **Easy Copy**: One-click copy to clipboard

---

## Development

Built with:
- HTML, CSS, JavaScript
- Chrome Extension Manifest V3
- Chrome Built-in AI Writer API
- Chrome Storage API

---

## Contributing

This is a personal project, but suggestions and feedback are welcome!

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Verify Chrome flags are enabled
3. Make sure Chrome is up to date (version 138+)

Contact
Jayanti Lahoti
jayantirl2001@gmail.com

---

**Work smart, not harder. Just highlight and enlight!**
