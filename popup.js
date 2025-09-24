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
  const copyBtn = document.getElementById('copyBtn');

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

  // On popup open, always try to get current selection first
  if (isExtensionEnv) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const tabId = tabs && tabs[0] && tabs[0].id;
      if (!tabId) {
        setSelectedTextUI('🎮 No text selected. Please highlight some text on the page! 🎮');
        return;
      }
      
      console.log('Popup opened, trying to get selection from tab:', tabId);
      
      // First, test if content script is loaded
      chrome.tabs.sendMessage(tabId, { action: 'ping' }, function(response) {
        if (chrome.runtime.lastError) {
          console.log('Content script not loaded, error:', chrome.runtime.lastError.message);
          console.log('Trying script injection fallback...');
          
          // Try alternative method: inject script to get selection with comprehensive handling
          chrome.scripting.executeScript({
            target: { tabId: tabId, allFrames: true },
            function: () => {
              console.log('Script injection running...');
              
              // Function to get selection from any context
              function getSelectionText() {
                // 1. Try regular window selection first
                let text = window.getSelection().toString().trim();
                console.log('Window selection:', text);
                if (text) return text;
                
                // 2. Check if active element is input/textarea
                const activeEl = document.activeElement;
                console.log('Active element:', activeEl);
                if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
                  const start = activeEl.selectionStart || 0;
                  const end = activeEl.selectionEnd || 0;
                  console.log('Input selection:', start, end);
                  if (start !== end) {
                    text = activeEl.value.substring(start, end).trim();
                    console.log('Input text:', text);
                    if (text) return text;
                  }
                }
                
                // 3. Check shadow DOM
                if (activeEl && activeEl.shadowRoot) {
                  const shadowSelection = activeEl.shadowRoot.getSelection();
                  if (shadowSelection) {
                    text = shadowSelection.toString().trim();
                    console.log('Shadow selection:', text);
                    if (text) return text;
                  }
                }
                
                // 4. Check all iframes
                const iframes = document.querySelectorAll('iframe');
                console.log('Found iframes:', iframes.length);
                for (let iframe of iframes) {
                  try {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    if (iframeDoc) {
                      text = iframeDoc.getSelection().toString().trim();
                      console.log('Iframe selection:', text);
                      if (text) return text;
                    }
                  } catch (e) {
                    console.log('Cross-origin iframe, skipping');
                  }
                }
                
                console.log('No selection found');
                return '';
              }
              
              return getSelectionText();
            }
          }, (results) => {
            console.log('Script injection results:', results);
            if (results && results[0] && results[0].result) {
              console.log('Got selection via script injection:', results[0].result);
              setSelectedTextUI(results[0].result);
            } else {
              setSelectedTextUI('🎮 No text selected. Please highlight some text on the page! 🎮');
            }
          });
        } else {
          console.log('Content script is loaded, getting selection...');
          // Content script is loaded, now get the selection
          chrome.tabs.sendMessage(tabId, { action: 'getSelectedText' }, function(response) {
            if (chrome.runtime.lastError) {
              console.log('Error getting selection:', chrome.runtime.lastError.message);
              setSelectedTextUI('🎮 No text selected. Please highlight some text on the page! 🎮');
            } else if (!response || !response.text || response.text.trim() === '') {
              console.log('No selection from content script');
              setSelectedTextUI('🎮 No text selected. Please highlight some text on the page! 🎮');
            } else {
              console.log('Got selection from content script:', response.text);
              setSelectedTextUI(response.text);
            }
          });
        }
      });
    });
  } else {
    // Preview mode
    setSelectedTextUI('This is a preview. Highlighted text will appear here in the real extension.');
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
    
    // Add system prompt with Jayanti's full context
    messages.push({ 
      role: 'system', 
      content: `You are Jayanti Lahoti's writing assistant. You know Jayanti's complete background:

EDUCATION:
- MS in Computer Science Engineering, University of California, San Diego, USA (2024-2026)
- GPA: 4.0, Specialization: Artificial Intelligence
- Teaching Assistant (TA) at Global Policy School for AI summer school
- Teaching Assistant at Qualcomm Institute in UCSD for Google Cloud Platform Machine Learning
- International Elite Summer School in Robotics and Entrepreneurship, Denmark (August 2025)
- B.E in Computer Science Engineering, BMS College of Engineering, India (2019-2023)
- GPA: 8.55, Organized NGO events, taught chess, built chess club website

PROFESSIONAL EXPERIENCE:
- Perception Researcher, Autonomous Vehicle Lab (Oct 2024 - June 2025): Engineered ROS node for object detection, researched multimodal sensor fusion algorithms
- Software Engineer, Hewlett Packard Enterprise (Aug 2023 - Aug 2024): Reduced server management time by 35% with React-based UI, architected CI/CD pipelines with Jenkins/Helm/Docker, raised test coverage from 10% to 95%, collaborated on scalable microservices with gRPC
- Research and Development Intern, Hewlett Packard Enterprise (Jan 2023 - July 2023): Built mirage mock server supporting 10,000+ records, designed inventory dashboard reducing manual tracking by 45%

PROJECTS:
- Lego Segmentation and Pose estimation with LEGO Group: Vision system for 6D pose estimation, trained on 20,000+ images
- Multi-Waste Segregation using Computer Vision and Robotic Arm: Led 4-person team, achieved 80% accuracy, published in peer-reviewed journal
- AI for Wind Energy Vibration Data Analysis with FruitPunch AI: Built time-series ML models, improved classification accuracy by 15%
- Hack-Connect Platform: Developed university collaboration platform with Next.js, TypeScript, REST APIs

SKILLS: Python, JavaScript/TypeScript, Go, C/C++, React/Next.js, SQL/NoSQL, Linux, TCP/IP, Kafka, PyTorch/TensorFlow, GCP/AWS/Azure, Docker/K8s, CI/CD, testing, Prometheus/Grafana

Write concise, professional emails, cover letters, and application answers. Use active voice, US spelling, and a confident, warm tone. If a job description is provided, tailor with Jayanti's most relevant achievements and quantified impact. Also incorporate relevant keywords from the job description naturally into the response to show alignment with the role requirements.` 
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
        max_tokens: 2000,
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
