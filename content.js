// Content script to handle text selection
let selectedText = '';

function captureSelection() {
  try {
    let text = '';
    
    // 1. Try regular window selection first
    text = (window.getSelection && window.getSelection().toString()) || '';
    console.log('Content script checking window selection:', text);
    if (text.trim()) {
      selectedText = text.trim();
      console.log('Content script captured selection (window):', selectedText);
      return;
    }
    
    // 2. Check if active element is input/textarea
    const activeEl = document.activeElement;
    console.log('Content script active element:', activeEl);
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
      const start = activeEl.selectionStart || 0;
      const end = activeEl.selectionEnd || 0;
      console.log('Content script input selection:', start, end);
      if (start !== end) {
        text = activeEl.value.substring(start, end).trim();
        if (text) {
          selectedText = text;
          console.log('Content script captured selection (input):', selectedText);
          return;
        }
      }
    }
    
    // 3. Check shadow DOM
    if (activeEl && activeEl.shadowRoot) {
      const shadowSelection = activeEl.shadowRoot.getSelection();
      if (shadowSelection) {
        text = shadowSelection.toString().trim();
        if (text) {
          selectedText = text;
          console.log('Content script captured selection (shadow):', selectedText);
          return;
        }
      }
    }
    
    // No selection found
    selectedText = '';
    console.log('Content script: no selection found');
  } catch (e) {
    selectedText = '';
    console.log('Content script selection error:', e);
  }
}

// Capture on multiple events for reliability with timing
function captureSelectionWithDelay() {
  // Small delay to let selection settle
  setTimeout(captureSelection, 10);
}

document.addEventListener('mouseup', captureSelectionWithDelay, true);
document.addEventListener('selectionchange', captureSelectionWithDelay, true);
document.addEventListener('keyup', (e) => {
  if (e && (e.key === 'Shift' || e.key === 'Meta' || e.key === 'Control' || e.key === 'Alt')) return;
  captureSelectionWithDelay();
}, true);

// Additional events for better coverage
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    captureSelectionWithDelay();
  }
}, true);

// Handle input/textarea selection changes
document.addEventListener('input', captureSelectionWithDelay, true);

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
});

console.log('Content script loaded and ready');
