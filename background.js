// Background script
chrome.runtime.onInstalled.addListener(function() {
  console.log('Text to LLM extension installed');
  // Create context menu for sending selection (remove existing first to prevent duplicates)
  chrome.contextMenus.removeAll(function() {
    chrome.contextMenus.create({
      id: 'send_selection_to_llm',
      title: 'Send selected text to LLM',
      contexts: ['selection']
    });
  });
});

// Handle messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSelectedText') {
    // This is handled by the content script
    return true;
  }

  // Chrome Built-in AI APIs are called directly from popup.js
  // No background script handling needed for Chrome AI APIs
});

// When the popup opens, proactively capture the current selection
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureSelectionNow') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs && tabs[0] && tabs[0].id;
      if (!tabId) { sendResponse({ ok: false }); return; }
      chrome.tabs.sendMessage(tabId, { action: 'getSelectedText' }, (response) => {
        if (response && response.text) {
          chrome.storage.local.set({ selectedText: response.text }, () => sendResponse({ ok: true, text: response.text }));
        } else {
          sendResponse({ ok: false });
        }
      });
    });
    return true;
  }
});

// Context menu handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'send_selection_to_llm') {
    const text = info.selectionText || '';
    if (text) {
      console.log('Context menu clicked with text:', text);
      // Save to storage so popup picks it up
      chrome.storage.local.set({ selectedText: text }, () => {
        console.log('Text saved to storage, opening popup...');
        // Try to open popup - if it fails, show notification
        try {
          chrome.action.openPopup?.();
        } catch (e) {
          console.log('Could not open popup directly, showing notification');
          chrome.notifications.create({
            type: 'basic',
            title: 'Text to LLM',
            message: `Selected text: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}" - Click extension icon to use it`
          });
        }
      });
    }
  }
});

// Keyboard shortcut
chrome.commands.onCommand.addListener((command) => {
  if (command === 'send_selection_to_llm') {
    // Try to get current tab selection via content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs && tabs[0] && tabs[0].id;
      if (!tabId) return;
      chrome.tabs.sendMessage(tabId, { action: 'getSelectedText' }, (response) => {
        if (response && response.text) {
          chrome.storage.local.set({ selectedText: response.text }, () => {
            chrome.action.openPopup?.();
          });
        }
      });
    });
  }
});
