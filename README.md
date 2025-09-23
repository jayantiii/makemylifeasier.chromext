# Text to LLM Chrome Extension

A Chrome extension that allows you to highlight text on any webpage and get AI responses from local LLMs via LM Studio instantly.

## Features

- **Text Selection**: Simply highlight any text on any webpage
- **Local AI Response**: Click the extension icon to send highlighted text to your local LLM
- **Custom Prompts**: Add your own prompts to get specific types of responses
- **Clean Interface**: Simple, modern popup interface
- **Privacy-First**: All processing happens locally on your machine
- **No API Costs**: Uses your local LM Studio setup

## Installation

1. **Download the extension files** to your computer
2. **Open Chrome** and go to `chrome://extensions/`
3. **Enable Developer mode** (toggle in the top right)
4. **Click "Load unpacked"** and select the folder containing the extension files
5. **Pin the extension** to your toolbar for easy access

## Setup

1. **Install and Setup LM Studio**:
   - Download [LM Studio](https://lmstudio.ai/) for your operating system
   - Install and open LM Studio
   - Go to the "Models" tab and search for "gpt-oss-20b"
   - Download the [gpt-oss-20b model](https://lmstudio.ai/models/openai/gpt-oss-20b) (requires ~12GB RAM)
   - Go to the "Local Server" tab and start the server (default port 1234)

2. **Configure the extension**:
   - Click the extension icon
   - The default API URL should be `http://localhost:1234`
   - The default model name should be `gpt-oss-20b`
   - Adjust these if you're using different settings
   - Settings will be saved automatically

## Usage

1. **Highlight text** on any webpage (job applications, emails, articles, etc.)
2. **Click the extension icon** in your toolbar
3. **Optionally add a custom prompt** (e.g., "Improve this text:", "Summarize this:", "Make this more professional:")
4. **Click "Send to LLM"** to get an AI response
5. **View the response** in the popup window

## Examples

- **Job Applications**: Highlight your cover letter and ask "Make this more compelling"
- **Emails**: Highlight a draft and ask "Make this more professional"
- **Content**: Highlight text and ask "Summarize this" or "Explain this in simple terms"
- **Writing**: Highlight text and ask "Fix grammar and improve clarity"

## Privacy & Security

- All processing happens locally on your machine
- Text is only sent to your local LM Studio server when you explicitly click "Send to LLM"
- No data is sent to external services
- No data is collected or stored by the extension itself

## Troubleshooting

- **"No text selected"**: Make sure you've highlighted text on the page before clicking the extension
- **Connection errors**: Make sure LM Studio is running and the server is started
- **Model not found**: Check that the gpt-oss-20b model is downloaded and loaded in LM Studio
- **Extension not working**: Try refreshing the page and highlighting text again
- **Slow responses**: The local model may take longer than cloud APIs, especially on first use

## Requirements

- Chrome browser
- LM Studio installed and running
- gpt-oss-20b model downloaded (requires ~12GB RAM)
- Local server running in LM Studio

## Support

If you encounter any issues, please check:
1. LM Studio is running and the local server is started
2. The gpt-oss-20b model is downloaded and loaded
3. The API URL is correct (default: http://localhost:1234)
4. The text is properly highlighted before clicking the extension
# makemylifeasier.chromext
