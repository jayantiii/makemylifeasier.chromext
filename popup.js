// Popup script
document.addEventListener('DOMContentLoaded', function() {
  const isExtensionEnv = !!(window.chrome && chrome.runtime && typeof chrome.runtime.sendMessage === 'function');
  const selectedTextEl = document.getElementById('selectedText');
  const promptInput = document.getElementById('prompt');
  const sendBtn = document.getElementById('sendBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const responseEl = document.getElementById('response');
  const loadingEl = document.getElementById('loading');
  const responseTextEl = document.getElementById('responseText');
  const copyBtn = document.getElementById('copyBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsPanel = document.getElementById('settingsPanel');
  const systemPromptTextarea = document.getElementById('systemPrompt');
  const saveSystemPromptBtn = document.getElementById('saveSystemPromptBtn');
  const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');

  // Default system prompt template
  const defaultSystemPrompt = `You are a professional writing assistant. Always produce a final, send-ready answer with no placeholders, brackets, or TODOs. Do not ask questions unless explicitly requested.

Your profile and writing style should be defined here. This will help the AI tailor responses to your needs.`;

  // Load saved system prompt on startup
  let userSystemPrompt = null;
  if (isExtensionEnv) {
    chrome.storage.local.get(['systemPrompt'], function(result) {
      if (result.systemPrompt && result.systemPrompt.trim()) {
        userSystemPrompt = result.systemPrompt;
        systemPromptTextarea.value = result.systemPrompt;
      } else {
        // First time user - show default template
        systemPromptTextarea.value = defaultSystemPrompt;
      }
    });
  } else {
    // Preview mode
    systemPromptTextarea.value = defaultSystemPrompt;
  }

  // Settings panel toggle
  settingsBtn.addEventListener('click', function() {
    const isVisible = settingsPanel.style.display !== 'none';
    settingsPanel.style.display = isVisible ? 'none' : 'block';
    if (!isVisible && isExtensionEnv) {
      // Load current saved prompt when opening settings
      chrome.storage.local.get(['systemPrompt'], function(result) {
        if (result.systemPrompt) {
          systemPromptTextarea.value = result.systemPrompt;
        } else {
          systemPromptTextarea.value = defaultSystemPrompt;
        }
      });
    }
  });

  // Save system prompt
  saveSystemPromptBtn.addEventListener('click', function() {
    const prompt = systemPromptTextarea.value.trim();
    if (!prompt) {
      showError('System prompt cannot be empty. Please enter a prompt.');
      return;
    }
    
    if (isExtensionEnv) {
      chrome.storage.local.set({ systemPrompt: prompt }, function() {
        userSystemPrompt = prompt;
        settingsPanel.style.display = 'none';
        showResponse('✅ System prompt saved successfully!');
        setTimeout(() => {
          responseEl.style.display = 'none';
        }, 2000);
      });
    } else {
      // Preview mode
      userSystemPrompt = prompt;
      settingsPanel.style.display = 'none';
      alert('System prompt saved (preview mode)');
    }
  });

  // Cancel settings
  cancelSettingsBtn.addEventListener('click', function() {
    settingsPanel.style.display = 'none';
    // Revert to saved prompt
    if (isExtensionEnv) {
      chrome.storage.local.get(['systemPrompt'], function(result) {
        if (result.systemPrompt) {
          systemPromptTextarea.value = result.systemPrompt;
        } else {
          systemPromptTextarea.value = defaultSystemPrompt;
        }
      });
    }
  });

  // Refresh selection button
  refreshBtn.addEventListener('click', function() {
    if (isExtensionEnv) {
      console.log('Refreshing selection...');
      setSelectedTextUI('🔄 Refreshing selection...');
      getCurrentSelection();
    }
  });

  // no-op (system prompt is handled in LM Studio)
  
  // Copy button functionality
  copyBtn.addEventListener('click', async function() {
    const text = responseTextEl.textContent;
    if (text) {
      try {
        await navigator.clipboard.writeText(text);
        // Show feedback
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✅ Copied!';
        copyBtn.style.background = '#4CAF50';
        setTimeout(() => {
          copyBtn.textContent = originalText;
          copyBtn.style.background = '#ff9ec4';
        }, 1500);
      } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        // Show feedback
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✅ Copied!';
        copyBtn.style.background = '#4CAF50';
        setTimeout(() => {
          copyBtn.textContent = originalText;
          copyBtn.style.background = '#ff9ec4';
        }, 1500);
      }
    }
  });

  // Real-time selection handling
  let currentTabId = null;
  
  // Listen for real-time selection updates from content script
  if (isExtensionEnv) {
    try {
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        try {
          if (request.action === 'selectionChanged') {
            console.log('Real-time selection update:', request.text ? `"${request.text}"` : '(empty)');
            if (request.text && request.text.trim()) {
              setSelectedTextUI(request.text);
            } else {
              setSelectedTextUI('🎮 No text selected. Please highlight some text on the page! 🎮');
            }
          }
        } catch (e) {
          console.log('Error handling real-time selection update:', e);
        }
      });
    } catch (e) {
      console.log('Extension context invalidated, real-time updates disabled');
    }
  }

  // On popup open, get current selection immediately
  if (isExtensionEnv) {
    // First check if there's stored text from context menu
    chrome.storage.local.get(['selectedText'], function(result) {
      if (result.selectedText && result.selectedText.trim()) {
        console.log('Found stored text from context menu:', result.selectedText);
        setSelectedTextUI(result.selectedText);
        // Clear the stored text so it doesn't persist
        chrome.storage.local.remove(['selectedText']);
        return;
      }
      
      // No stored text, get current selection immediately
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        const tabId = tabs && tabs[0] && tabs[0].id;
        currentTabId = tabId;
        
        if (!tabId) {
          setSelectedTextUI('🎮 No text selected. Please highlight some text on the page! 🎮');
          return;
        }
        
        console.log('Popup opened, getting current selection from tab:', tabId);
        
        // Try to get selection immediately first (in case content script is already loaded)
        getCurrentSelection();
        
        // Check if content script is already loaded before injecting
        chrome.tabs.sendMessage(tabId, { action: 'ping' }, function(response) {
          if (chrome.runtime.lastError) {
            // Content script not loaded, inject it
            console.log('Content script not loaded, injecting...');
            chrome.scripting.executeScript({
              target: { tabId: tabId, allFrames: true },
              files: ['content.js']
            }, () => {
              console.log('Content script injected');
              
              // Get current selection after injection
              setTimeout(() => {
                getCurrentSelection();
              }, 100);
            });
          } else {
            // Content script already loaded
            console.log('Content script already loaded');
            // Get current selection again
            setTimeout(() => {
              getCurrentSelection();
            }, 50);
          }
        });
      });
    });
  } else {
    // Preview mode
    setSelectedTextUI('This is a preview. Highlighted text will appear here in the real extension.');
  }

  function getCurrentSelection() {
    if (!currentTabId) return;
    
    console.log('Getting current selection...');
    
    try {
      chrome.tabs.sendMessage(currentTabId, { action: 'getSelectedText' }, function(response) {
        if (chrome.runtime.lastError) {
          console.log('Content script not available, trying direct injection:', chrome.runtime.lastError.message);
          // Fallback to direct script injection
          getSelectionDirectly();
        } else if (!response || !response.text || response.text.trim() === '') {
          console.log('No selection from content script, trying direct injection...');
          // Try direct injection as backup
          getSelectionDirectly();
        } else {
          console.log('Got current selection from content script:', response.text);
          setSelectedTextUI(response.text);
        }
      });
    } catch (e) {
      console.log('Extension context invalidated, trying direct injection:', e);
      getSelectionDirectly();
    }
  }

  function getSelectionDirectly() {
    if (!currentTabId) return;
    
    console.log('Running direct script injection to get current selection...');
    
    chrome.scripting.executeScript({
      target: { tabId: currentTabId, allFrames: true },
      function: () => {
        console.log('Direct script injection running...');
        
        // Function to get selection from any context
        function getSelectionText() {
          // 1. Try regular window selection first
          let text = window.getSelection().toString().trim();
          console.log('Direct injection - Window selection:', text);
          if (text) return text;
          
          // 2. Check if active element is input/textarea
          const activeEl = document.activeElement;
          console.log('Direct injection - Active element:', activeEl);
          if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
            const start = activeEl.selectionStart || 0;
            const end = activeEl.selectionEnd || 0;
            console.log('Direct injection - Input selection:', start, end);
            if (start !== end) {
              text = activeEl.value.substring(start, end).trim();
              console.log('Direct injection - Input text:', text);
              if (text) return text;
            }
          }
          
          // 3. Check shadow DOM
          if (activeEl && activeEl.shadowRoot) {
            const shadowSelection = activeEl.shadowRoot.getSelection();
            if (shadowSelection) {
              text = shadowSelection.toString().trim();
              console.log('Direct injection - Shadow selection:', text);
              if (text) return text;
            }
          }
          
          // 4. Check all iframes
          const iframes = document.querySelectorAll('iframe');
          console.log('Direct injection - Found iframes:', iframes.length);
          for (let iframe of iframes) {
            try {
              const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
              if (iframeDoc) {
                text = iframeDoc.getSelection().toString().trim();
                console.log('Direct injection - Iframe selection:', text);
                if (text) return text;
              }
            } catch (e) {
              console.log('Direct injection - Cross-origin iframe, skipping');
            }
          }
          
          console.log('Direct injection - No selection found');
          return '';
        }
        
        return getSelectionText();
      }
    }, (results) => {
      console.log('Direct script injection results:', results);
      if (results && results[0] && results[0].result && results[0].result.trim()) {
        console.log('Got selection via direct injection:', results[0].result);
        setSelectedTextUI(results[0].result);
      } else {
        console.log('No selection found via direct injection');
        setSelectedTextUI('🎮 No text selected. Please highlight some text on the page! 🎮');
      }
    });
  }


  function setSelectedTextUI(text) {
    selectedTextEl.textContent = text;
    selectedTextEl.style.background = '#e8f5e8';
    selectedTextEl.style.borderColor = '#4caf50';
  }

  // Send to LLM
  sendBtn.addEventListener('click', async function() {
    const selectedText = selectedTextEl.textContent;
    const customPrompt = promptInput.value.trim();

    console.log('Selected text:', selectedText);
    console.log('Custom prompt:', customPrompt);
    console.log('Is extension env:', isExtensionEnv);

    // Need either custom prompt or selected text
    if (!customPrompt && (!selectedText || selectedText.includes('No text selected') || selectedText.includes('🎮'))) {
      showError('Please enter a custom prompt or select some text.');
      return;
    }

    // Get system prompt - need to load from storage if not already loaded
    const getSystemPrompt = () => {
      return new Promise((resolve) => {
        if (userSystemPrompt) {
          resolve(userSystemPrompt);
        } else if (isExtensionEnv) {
          chrome.storage.local.get(['systemPrompt'], function(result) {
            if (result.systemPrompt && result.systemPrompt.trim()) {
              userSystemPrompt = result.systemPrompt;
              resolve(result.systemPrompt);
            } else {
              resolve(defaultSystemPrompt);
            }
          });
        } else {
          const textareaValue = systemPromptTextarea.value.trim();
          resolve(textareaValue || defaultSystemPrompt);
        }
      });
    };

    // Load system prompt
    const systemPrompt = await getSystemPrompt();
    
    // Warn if using default prompt (only if it's exactly the default)
    if (systemPrompt === defaultSystemPrompt || !systemPrompt || systemPrompt.trim() === '') {
      if (confirm('No system prompt is set. Would you like to configure one now? (Click OK to open settings, Cancel to continue with default)')) {
        settingsPanel.style.display = 'block';
        return;
      }
    }

    // Build content for Chrome Built-in AI APIs
    let content = '';

    // Writer mode: generate new content
    if (customPrompt && selectedText && !selectedText.includes('No text selected') && !selectedText.includes('🎮')) {
      content = `${systemPrompt}\n\nUser request: ${customPrompt}\n\nContext: ${selectedText}`;
    } else if (customPrompt) {
      content = `${systemPrompt}\n\nUser request: ${customPrompt}`;
    } else if (selectedText && !selectedText.includes('No text selected') && !selectedText.includes('🎮')) {
      content = `${systemPrompt}\n\nUser request: Write about this: ${selectedText}`;
    }
    
    console.log('Content for AI:', content);

    try {
      showLoading(true);
      console.log('Using Chrome Built-in AI Writer API');
      
      if (isExtensionEnv) {
        // Check if Chrome Built-in AI APIs are available
        console.log('Checking Chrome AI availability...');
        console.log('chrome object:', typeof chrome);
        console.log('chrome.ai:', chrome?.ai);
        console.log('chrome.ai.writer:', chrome?.ai?.writer);
        
        // Try different ways to access the Writer API
        let aiWriter = null;
        
        // Check for different possible API locations
        if (chrome?.ai?.writer) {
          aiWriter = chrome.ai.writer;
        } else if (chrome?.writer) {
          aiWriter = chrome.writer;
        } else if (window?.Writer) {
          aiWriter = window.Writer;
        }
        
        console.log('Found aiWriter:', !!aiWriter);
        
        if (aiWriter) {
          // Use Chrome Built-in AI Writer API
          try {
            console.log('Creating Writer instance...');
            const writer = await aiWriter.create();
            console.log('Writer instance created:', writer);
            console.log('Writer methods:', Object.getOwnPropertyNames(writer));
            console.log('Writer prototype methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(writer)));
            
            // Try different method names with language specification
            let result;
            if (typeof writer.write === 'function') {
              result = await writer.write(content, { language: 'en' });
            } else if (typeof writer.generate === 'function') {
              result = await writer.generate(content, { language: 'en' });
            } else if (typeof writer.createText === 'function') {
              result = await writer.createText(content, { language: 'en' });
            } else if (typeof writer.complete === 'function') {
              result = await writer.complete(content, { language: 'en' });
            } else {
              // Try calling it directly with language
              result = await writer(content, { language: 'en' });
            }
            
            console.log('Writer result:', result);
            console.log('Chrome AI result:', result);
            showResponse(result.text || result.content || result || 'No response received');
          } catch (apiError) {
            console.error('Writer API error:', apiError);
            throw new Error(`Writer API error: ${apiError.message}`);
          }
        } else {
          // Fallback: Use a simple mock response
          console.log('Chrome Built-in AI not available, using fallback');
          console.log('Chrome version:', navigator.userAgent);
          console.log('Available chrome properties:', Object.keys(chrome || {}));
          await new Promise(r => setTimeout(r, 1000));
          
          // Generate a generic fallback response based on the prompt
          let response = `[Writer Mode - Fallback]\n\nChrome Built-in AI is not available. Please enable the "writer-api-for-gemini-nano" flag in chrome://flags/ and restart Chrome.\n\n`;
          
          if (customPrompt.toLowerCase().includes('cover letter')) {
            response += `**Cover Letter Template:**\n\nDear Hiring Manager,\n\nI am writing to express my strong interest in the [Position Title] role at [Company Name].\n\n[Your background and qualifications]\n\n[Why you're interested and how you can contribute]\n\nSincerely,\n[Your Name]\n\n[Note: Enable Chrome Built-in AI flags for more sophisticated responses]`;
          } else if (customPrompt.toLowerCase().includes('email')) {
            response += `**Professional Email:**\n\nSubject: ${customPrompt}\n\nDear [Recipient],\n\nI hope this email finds you well.\n\n[Your message here]\n\nBest regards,\n[Your Name]\n\n[Note: Enable Chrome Built-in AI flags for more sophisticated responses]`;
          } else {
            response += `**Professional Response:**\n\n${customPrompt}\n\n[Your response here based on your system prompt settings]\n\n[Note: Enable Chrome Built-in AI flags for more sophisticated responses]`;
          }
          
          showResponse(response);
        }
      } else {
        // Preview mode: synthesize a mock response
        await new Promise(r => setTimeout(r, 400));
        showResponse(`[Preview] Writer response would appear here.`);
      }
    } catch (error) {
      console.error('Chrome AI API error:', error);
      showError('Error: ' + error.message);
    } finally {
      showLoading(false);
    }
  });


  function showLoading(show) {
    loadingEl.style.display = show ? 'block' : 'none';
    sendBtn.disabled = show;
  }

  function showResponse(text) {
    // Format the text for better display
    const formattedText = formatResponseText(text);
    responseTextEl.textContent = formattedText;
    responseEl.style.display = 'block';
    copyBtn.style.display = 'block';
    // Scroll to bottom to show new content
    responseEl.scrollTop = responseEl.scrollHeight;
  }
  
  function formatResponseText(text) {
    // Clean up the text and ensure proper paragraph breaks
    return text
      .replace(/\n\n+/g, '\n\n') // Normalize multiple line breaks
      .replace(/^\s+|\s+$/g, '') // Trim whitespace
      .replace(/\n/g, '\n'); // Ensure consistent line breaks
  }

  function showError(message) {
    responseTextEl.innerHTML = `<div class="error">${message}</div>`;
    responseEl.style.display = 'block';
    copyBtn.style.display = 'none'; // Hide copy button for errors
    // Scroll to bottom to show error
    responseEl.scrollTop = responseEl.scrollHeight;
  }
});
