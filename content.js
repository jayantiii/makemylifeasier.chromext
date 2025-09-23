// Content script to handle text selection
let selectedText = '';

function captureSelection() {
  try {
    const text = (window.getSelection && window.getSelection().toString()) || '';
    const trimmed = (text || '').trim();
    if (trimmed) {
      selectedText = trimmed;
      chrome.storage.local.set({ selectedText: trimmed });
    }
  } catch (e) {
    // ignore
  }
}

// Capture on multiple events for reliability
document.addEventListener('mouseup', captureSelection, true);
document.addEventListener('selectionchange', captureSelection, true);
document.addEventListener('keyup', (e) => {
  if (e && (e.key === 'Shift' || e.key === 'Meta' || e.key === 'Control' || e.key === 'Alt')) return;
  captureSelection();
}, true);

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSelectedText') {
    if (selectedText && selectedText.trim()) {
      sendResponse({ text: selectedText });
      return true;
    }
    // Fallback: read last stored selection
    chrome.storage.local.get(['selectedText'], (res) => {
      sendResponse({ text: (res && res.selectedText) || '' });
    });
    return true; // async response
  }
});
