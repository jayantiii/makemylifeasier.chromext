// Popup script
document.addEventListener('DOMContentLoaded', function() {
  const isExtensionEnv = !!(window.chrome && chrome.runtime && typeof chrome.runtime.sendMessage === 'function');
  const selectedTextEl = document.getElementById('selectedText');
  const apiUrlInput = document.getElementById('apiUrl');
  const modelNameInput = document.getElementById('modelName');
  const promptInput = document.getElementById('prompt');
  // Removed system prompt and session inputs from popup UI (using LM Studio global system prompt instead)
  const sendBtn = document.getElementById('sendBtn');
  const responseEl = document.getElementById('response');
  const loadingEl = document.getElementById('loading');
  const responseTextEl = document.getElementById('responseText');

  // Load saved settings (extension only)
  if (isExtensionEnv) {
    chrome.storage.local.get(['apiUrl', 'modelName'], function(result) {
      if (result.apiUrl) {
        apiUrlInput.value = result.apiUrl;
      }
      if (result.modelName) {
        modelNameInput.value = result.modelName;
      }
    });
  }

  // Save settings when changed
  apiUrlInput.addEventListener('input', function() {
    if (isExtensionEnv) chrome.storage.local.set({ apiUrl: apiUrlInput.value });
  });
  
  modelNameInput.addEventListener('input', function() {
    if (isExtensionEnv) chrome.storage.local.set({ modelName: modelNameInput.value });
  });

  // no-op (system prompt is handled in LM Studio)

  // On popup open, either capture real selection (extension) or use mock text (preview)
  if (isExtensionEnv) {
    chrome.runtime.sendMessage({ action: 'captureSelectionNow' }, (resp) => {
      if (resp && resp.ok && resp.text) {
        setSelectedTextUI(resp.text);
      } else {
        loadFromStorageFallback();
      }
    });
  } else {
    // Preview mode
    setSelectedTextUI('This is a preview. Highlighted text will appear here in the real extension.');
  }

  function loadFromStorageFallback() {
    chrome.storage.local.get(['selectedText'], function(res) {
      if (res && res.selectedText) {
        setSelectedTextUI(res.selectedText);
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
    const apiUrl = apiUrlInput.value.trim();
    const modelName = modelNameInput.value.trim();
    const customPrompt = promptInput.value.trim();

    if (!selectedText || selectedText === 'No text selected. Please highlight some text on the page.') {
      showError('Please select some text on the page first.');
      return;
    }

    if (!apiUrl && isExtensionEnv) {
      showError('Please enter the LM Studio API URL.');
      return;
    }

    // Build messages: combine custom prompt with selected text, and add system prompt
    const messages = [];
    
    // Add system prompt with Jayanti's context
    messages.push({ 
      role: 'system', 
      content: `You are Jayanti Lahoti's writing assistant. You know Jayanti's background: MS CSE @ UCSD (AI), ex-HPE SWE with React/microservices experience, AV perception research, projects in CV/ML. Write concise, professional emails, cover letters, and application answers. Use active voice, US spelling, and a confident, warm tone. If a job description is provided, tailor with Jayanti's most relevant achievements and quantified impact.` 
    });
    
    // Combine custom prompt with selected text
    let userContent = selectedText;
    if (customPrompt) {
      userContent = `${customPrompt}\n\n${selectedText}`;
    }
    messages.push({ role: 'user', content: userContent });

    try {
      showLoading(true);
      if (isExtensionEnv) {
        // Prefer background fetch to avoid CORS and mixed-content issues
        const bgResp = await chrome.runtime.sendMessage({
          action: 'lmstudioRequest',
          payload: { apiUrl, modelName, messages }
        });

        if (!bgResp || !bgResp.ok) {
          const bgError = bgResp?.error || 'Failed to fetch';
          // Fallback to direct fetch from popup
          try {
            const direct = await sendToLMStudio(messages, apiUrl, modelName);
            showResponse(direct);
          } catch (directErr) {
            showError('Error: ' + bgError + (directErr?.message ? `; Fallback: ${directErr.message}` : ''));
          }
          return;
        }

        showResponse(bgResp.text);
      } else {
        // Preview mode: synthesize a mock response
        await new Promise(r => setTimeout(r, 400));
        showResponse('[Preview] Response would appear here.');
      }
    } catch (error) {
      showError('Error: ' + error.message);
    } finally {
      showLoading(false);
    }
  });

  async function sendToLMStudio(messages, apiUrl, modelName) {
    // Ensure the URL has the correct endpoint
    const fullUrl = apiUrl.endsWith('/v1/chat/completions') ? apiUrl : `${apiUrl}/v1/chat/completions`;
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: modelName || 'meta-llama-3.1-8b-instruct',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
        stream: false
      })
    });

    if (!response.ok) {
      let errorMessage = 'Failed to get response from LM Studio';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorMessage;
      } catch (e) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  function showLoading(show) {
    loadingEl.style.display = show ? 'block' : 'none';
    sendBtn.disabled = show;
  }

  function showResponse(text) {
    responseTextEl.textContent = text;
    responseEl.style.display = 'block';
    // Scroll to bottom to show new content
    responseEl.scrollTop = responseEl.scrollHeight;
  }

  function showError(message) {
    responseTextEl.innerHTML = `<div class="error">${message}</div>`;
    responseEl.style.display = 'block';
    // Scroll to bottom to show error
    responseEl.scrollTop = responseEl.scrollHeight;
  }
});
