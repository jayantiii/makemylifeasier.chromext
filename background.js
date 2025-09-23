// Background script
chrome.runtime.onInstalled.addListener(function() {
  console.log('Text to LLM extension installed');
  // Create context menu for sending selection
  chrome.contextMenus.create({
    id: 'send_selection_to_llm',
    title: 'Send selected text to LLM',
    contexts: ['selection']
  });
});

// Handle messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSelectedText') {
    // This is handled by the content script
    return true;
  }

  if (request.action === 'lmstudioRequest') {
    const { apiUrl, modelName, messages, session } = request.payload || {};

    // Build full URL if needed
    const fullUrl = apiUrl && apiUrl.endsWith('/v1/chat/completions')
      ? apiUrl
      : `${apiUrl}/v1/chat/completions`;

    fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: modelName || 'meta-llama-3.1-8b-instruct',
        messages: Array.isArray(messages) && messages.length ? messages : [{ role: 'user', content: '' }],
        max_tokens: 1000,
        temperature: 0.7,
        stream: false
      })
    })
      .then(async (resp) => {
        if (!resp.ok) {
          let errorMessage = `HTTP ${resp.status}: ${resp.statusText}`;
          try {
            const errData = await resp.json();
            errorMessage = errData.error?.message || errorMessage;
          } catch (_) {}
          sendResponse({ ok: false, error: errorMessage });
          return;
        }
        const data = await resp.json();
        const text = data?.choices?.[0]?.message?.content || '';
        sendResponse({ ok: true, text });
      })
      .catch((err) => {
        sendResponse({ ok: false, error: err?.message || 'Network error' });
      });

    // Indicate async response
    return true;
  }
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
      // Save to storage so popup picks it up
      chrome.storage.local.set({ selectedText: text }, () => {
        // Open the popup by toggling the action popup (workaround: show a basic notification to prompt user)
        chrome.action.openPopup?.();
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
