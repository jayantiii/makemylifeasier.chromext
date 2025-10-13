// Content script to handle real-time text selection
// Check if already loaded to prevent duplicate declarations
if (typeof window.textToLLMContentScriptLoaded === 'undefined') {
  window.textToLLMContentScriptLoaded = true;
  
  let selectedText = '';
  let lastSelectionTime = 0;

function getCurrentSelection() {
  try {
    let text = '';
    
    // 1. Try regular window selection first
    const selection = window.getSelection();
    if (selection) {
      text = selection.toString().trim();
      console.log('Real-time selection check (window):', text);
      if (text) {
        return text;
      }
    }
    
    // 2. Check if active element is input/textarea
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
      const start = activeEl.selectionStart || 0;
      const end = activeEl.selectionEnd || 0;
      if (start !== end) {
        text = activeEl.value.substring(start, end).trim();
        console.log('Real-time selection check (input):', text);
        if (text) {
          return text;
        }
      }
    }
    
    // 3. Check shadow DOM
    if (activeEl && activeEl.shadowRoot) {
      const shadowSelection = activeEl.shadowRoot.getSelection();
      if (shadowSelection) {
        text = shadowSelection.toString().trim();
        console.log('Real-time selection check (shadow):', text);
        if (text) {
          return text;
        }
      }
    }
    
    // 4. Check all iframes
    const iframes = document.querySelectorAll('iframe');
    for (let iframe of iframes) {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        if (iframeDoc) {
          text = iframeDoc.getSelection().toString().trim();
          if (text) {
            console.log('Real-time selection check (iframe):', text);
            return text;
          }
        }
      } catch (e) {
        // Cross-origin iframe, skip
      }
    }
    
    return '';
  } catch (e) {
    console.log('Real-time selection error:', e);
    return '';
  }
}

function updateSelection() {
  const currentTime = Date.now();
  const newSelection = getCurrentSelection();
  
  // Only update if selection actually changed
  if (newSelection !== selectedText) {
    selectedText = newSelection;
    lastSelectionTime = currentTime;
    console.log('Selection updated:', selectedText ? `"${selectedText}"` : '(empty)');
    
    // Notify popup if it's open (only if chrome.runtime is still available)
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      try {
        chrome.runtime.sendMessage({
          action: 'selectionChanged',
          text: selectedText,
          timestamp: currentTime
        }).catch(() => {
          // Popup might be closed or extension context invalidated
          console.log('Extension context invalidated, stopping message sends');
          // Clear the interval to prevent further attempts
          if (selectionInterval) {
            clearInterval(selectionInterval);
            selectionInterval = null;
          }
        });
      } catch (e) {
        // Extension context invalidated, stop trying
        console.log('Extension context invalidated, stopping message sends');
        if (selectionInterval) {
          clearInterval(selectionInterval);
          selectionInterval = null;
        }
      }
    }
  }
}

// Real-time selection updates with immediate response
function updateSelectionImmediate() {
  // Only update if chrome.runtime is still available
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
    updateSelection();
  }
}

// More frequent updates for real-time feel
function updateSelectionWithDelay() {
  // Only update if chrome.runtime is still available
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
    setTimeout(updateSelection, 5);
  }
}

// Immediate updates on selection changes
document.addEventListener('selectionchange', updateSelectionImmediate, true);
document.addEventListener('mouseup', updateSelectionWithDelay, true);
document.addEventListener('mousedown', updateSelectionWithDelay, true);

// Keyboard events
document.addEventListener('keyup', (e) => {
  if (e && (e.key === 'Shift' || e.key === 'Meta' || e.key === 'Control' || e.key === 'Alt')) return;
  updateSelectionWithDelay();
}, true);

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    updateSelectionWithDelay();
  }
}, true);

// Input/textarea events
document.addEventListener('input', updateSelectionImmediate, true);
document.addEventListener('focus', updateSelectionWithDelay, true);
document.addEventListener('blur', updateSelectionWithDelay, true);

// Additional listeners for complex sites
document.body.addEventListener('mouseup', updateSelectionWithDelay, true);
document.body.addEventListener('selectionchange', updateSelectionImmediate, true);

// Periodic check to catch any missed updates
let selectionInterval = setInterval(() => {
  try {
    updateSelection();
  } catch (e) {
    console.log('Extension context invalidated, stopping selection interval');
    clearInterval(selectionInterval);
  }
}, 100);

// Listen for messages from popup
try {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    try {
      if (request.action === 'ping') {
        console.log('Content script received ping, responding...');
        sendResponse({ status: 'alive' });
        return true;
      }
      
      if (request.action === 'getSelectedText') {
        console.log('Content script received getSelectedText request, current selection:', selectedText);
        console.log('Content script selection length:', selectedText.length);
        // Always return current selection, never fallback to storage
        sendResponse({ text: selectedText || '' });
        return true;
      }
    } catch (e) {
      console.log('Error handling message in content script:', e);
      sendResponse({ error: e.message });
    }
  });
} catch (e) {
  console.log('Extension context invalidated, content script message listener disabled');
}

console.log('Content script loaded and ready');
} // End of duplicate prevention check
