// Popup script
document.addEventListener('DOMContentLoaded', function() {
  const isExtensionEnv = !!(window.chrome && chrome.runtime && typeof chrome.runtime.sendMessage === 'function');
  const selectedTextEl = document.getElementById('selectedText');
  const aiModeSelect = document.getElementById('aiMode');
  const promptInput = document.getElementById('prompt');
  const sendBtn = document.getElementById('sendBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const responseEl = document.getElementById('response');
  const loadingEl = document.getElementById('loading');
  const responseTextEl = document.getElementById('responseText');
  const copyBtn = document.getElementById('copyBtn');

  // Load saved settings (extension only)
  if (isExtensionEnv) {
    chrome.storage.local.get(['aiMode'], function(result) {
      if (result.aiMode) {
        aiModeSelect.value = result.aiMode;
      }
    });
  }

  // Save settings when changed
  aiModeSelect.addEventListener('change', function() {
    if (isExtensionEnv) chrome.storage.local.set({ aiMode: aiModeSelect.value });
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
    const aiMode = aiModeSelect.value;
    const customPrompt = promptInput.value.trim();

    console.log('Selected text:', selectedText);
    console.log('AI Mode:', aiMode);
    console.log('Custom prompt:', customPrompt);
    console.log('Is extension env:', isExtensionEnv);

    // For Writer mode, we need either custom prompt or selected text
    // For Rewriter mode, we need selected text
    if (aiMode === 'rewriter' && (!selectedText || selectedText.includes('No text selected') || selectedText.includes('🎮'))) {
      showError('Please select some text to rewrite.');
      return;
    }

    if (aiMode === 'writer' && !customPrompt && (!selectedText || selectedText.includes('No text selected') || selectedText.includes('🎮'))) {
      showError('Please enter a custom prompt or select some text for the Writer.');
      return;
    }

    // Build content for Chrome Built-in AI APIs
    let content = '';
    let systemPrompt = `You are a professional writing assistant for Jayanti Lahoti. Always produce a final, send-ready answer with no placeholders, brackets, or TODOs. Do not ask questions unless explicitly requested.

Profile (use for tailoring without restating it):
- MS CSE @ UC San Diego (GPA 4.0), AI specialization; TA for AI and GCP ML
- Perception Researcher: ROS object detection, multimodal sensor fusion
- HPE Software Engineer: React UI, microservices (gRPC/Protobuf), CI/CD (Jenkins/Helm/Docker), K8s; reduced server management time by 35%; raised test coverage 10%→95%
- HPE R&D Intern: 10k-record mock server; inventory dashboard; test automation
- Projects: LEGO 6D pose; waste-seg CV + robotic arm (80% accuracy, publication); wind-energy time-series ML; Next.js collab platform
- Skills: Python, JS/TS, React/Next.js, SQL/NoSQL, Linux, Kafka, PyTorch/TensorFlow, GCP/AWS/Azure, Docker/K8s, CI/CD, testing

Style & constraints:
- Tone: concise, confident, warm, and professional; US spelling; active voice
- Cover letters: 150–250 words; 3–5 short paragraphs (hook, match, evidence, motivation, close)
- Emails: include a clear subject, direct ask/CTA, and sign-off (“Best regards, Jayanti Lahoti”)
- Application answers: direct, examples with quantified impact; respect any word/char limits
- If a job description or context is provided, tailor with relevant achievements and keywords
- Do not include meta commentary about your process; just the final copy
- No brackets like [Company], [Role], or placeholders—infer from context or write neutral but complete copy`;

    if (aiMode === 'writer') {
      // Writer mode: generate new content
      if (customPrompt && selectedText && !selectedText.includes('No text selected') && !selectedText.includes('🎮')) {
        content = `${systemPrompt}\n\nUser request: ${customPrompt}\n\nContext: ${selectedText}`;
      } else if (customPrompt) {
        content = `${systemPrompt}\n\nUser request: ${customPrompt}`;
      } else if (selectedText && !selectedText.includes('No text selected') && !selectedText.includes('🎮')) {
        content = `${systemPrompt}\n\nUser request: Write about this: ${selectedText}`;
      }
    } else if (aiMode === 'rewriter') {
      // Rewriter mode: improve selected text
      content = `${systemPrompt}\n\nPlease rewrite and improve this text: ${selectedText}`;
    }
    
    console.log('AI Mode:', aiMode);
    console.log('Content for AI:', content);

    try {
      showLoading(true);
      console.log('Using Chrome Built-in AI API:', aiMode);
      
      if (isExtensionEnv) {
        // Check if Chrome Built-in AI APIs are available
        console.log('Checking Chrome AI availability...');
        console.log('chrome object:', typeof chrome);
        console.log('chrome.ai:', chrome?.ai);
        console.log('chrome.ai.writer:', chrome?.ai?.writer);
        console.log('chrome.ai.rewriter:', chrome?.ai?.rewriter);
        
        // Try different ways to access the AI APIs
        let aiWriter = null;
        let aiRewriter = null;
        
        // Check for different possible API locations
        if (chrome?.ai?.writer) {
          aiWriter = chrome.ai.writer;
        } else if (chrome?.writer) {
          aiWriter = chrome.writer;
        } else if (window?.Writer) {
          aiWriter = window.Writer;
        }
        
        if (chrome?.ai?.rewriter) {
          aiRewriter = chrome.ai.rewriter;
        } else if (chrome?.rewriter) {
          aiRewriter = chrome.rewriter;
        } else if (window?.Rewriter) {
          aiRewriter = window.Rewriter;
        }
        
        console.log('Found aiWriter:', !!aiWriter);
        console.log('Found aiRewriter:', !!aiRewriter);
        
        if (aiWriter || aiRewriter) {
          // Use Chrome Built-in AI APIs
          let result;
          
          if (aiMode === 'writer' && aiWriter) {
            // Use Writer API - need to create instance first
            try {
              console.log('Creating Writer instance...');
              const writer = await aiWriter.create();
              console.log('Writer instance created:', writer);
              console.log('Writer methods:', Object.getOwnPropertyNames(writer));
              console.log('Writer prototype methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(writer)));
              
              // Try different method names with language specification
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
            } catch (apiError) {
              console.error('Writer API error:', apiError);
              throw new Error(`Writer API error: ${apiError.message}`);
            }
          } else if (aiMode === 'rewriter' && aiRewriter) {
            // Use Rewriter API - need to create instance first
            try {
              console.log('Creating Rewriter instance...');
              const rewriter = await aiRewriter.create();
              console.log('Rewriter instance created:', rewriter);
              console.log('Rewriter methods:', Object.getOwnPropertyNames(rewriter));
              console.log('Rewriter prototype methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(rewriter)));
              
              // Try different method names with language specification
              if (typeof rewriter.rewrite === 'function') {
                result = await rewriter.rewrite(selectedText, content, { language: 'en' });
              } else if (typeof rewriter.improve === 'function') {
                result = await rewriter.improve(selectedText, content, { language: 'en' });
              } else if (typeof rewriter.enhance === 'function') {
                result = await rewriter.enhance(selectedText, content, { language: 'en' });
              } else if (typeof rewriter.edit === 'function') {
                result = await rewriter.edit(selectedText, content, { language: 'en' });
              } else {
                // Try calling it directly with both parameters and language
                result = await rewriter(selectedText, content, { language: 'en' });
              }
              
              console.log('Rewriter result:', result);
            } catch (apiError) {
              console.error('Rewriter API error:', apiError);
              throw new Error(`Rewriter API error: ${apiError.message}`);
            }
          } else {
            throw new Error(`${aiMode} API not available. Please enable Chrome Built-in AI flags.`);
          }
          
          console.log('Chrome AI result:', result);
          showResponse(result.text || result.content || result || 'No response received');
        } else {
          // Fallback: Use a simple mock response with your system prompt
          console.log('Chrome Built-in AI not available, using fallback');
          console.log('Chrome version:', navigator.userAgent);
          console.log('Available chrome properties:', Object.keys(chrome || {}));
          await new Promise(r => setTimeout(r, 1000));
          
          if (aiMode === 'writer') {
            // Generate a proper fallback response based on the prompt
            let response = `[Writer Mode - Fallback]\n\nBased on your background as a Computer Science Engineering student at UCSD with experience at HPE and the Autonomous Vehicle Lab:\n\n`;
            
            if (customPrompt.toLowerCase().includes('cover letter')) {
              response += `**Cover Letter Template:**\n\nDear Hiring Manager,\n\nI am writing to express my strong interest in the [Position Title] role at [Company Name]. As a Computer Science Engineering student at UCSD with a 4.0 GPA and specialization in Artificial Intelligence, I bring a unique combination of academic excellence and practical experience.\n\nMy professional experience includes:\n• Software Engineer at Hewlett Packard Enterprise (Aug 2023 - Aug 2024): Reduced server management time by 35% with React-based UI, architected CI/CD pipelines\n• Research and Development Intern at HPE (Jan 2023 - July 2023): Built mirage mock server supporting 10,000+ records\n• Current role as Perception Researcher at Autonomous Vehicle Lab: Engineered ROS node for object detection\n\nMy technical skills include Python, JavaScript/TypeScript, React/Next.js, AWS/GCP/Azure, Docker/K8s, and I have experience with PyTorch/TensorFlow for machine learning projects.\n\nI am excited about the opportunity to contribute to [Company Name] and would welcome the chance to discuss how my background aligns with your needs.\n\nSincerely,\nJayanti Lahoti\n\n[Note: Enable Chrome Built-in AI flags for more sophisticated responses]`;
            } else if (customPrompt.toLowerCase().includes('email')) {
              response += `**Professional Email:**\n\nSubject: ${customPrompt}\n\nDear [Recipient],\n\nI hope this email finds you well. [Customize based on your specific request]\n\nBest regards,\nJayanti Lahoti\nComputer Science Engineering Student\nUC San Diego\n\n[Note: Enable Chrome Built-in AI flags for more sophisticated responses]`;
            } else {
              response += `**Professional Response:**\n\n${customPrompt}\n\nGiven my background in Computer Science Engineering at UCSD, experience at HPE, and current research at the Autonomous Vehicle Lab, I would approach this by [provide specific insights based on your technical background].\n\n[Note: Enable Chrome Built-in AI flags for more sophisticated responses]`;
            }
            
            showResponse(response);
          } else if (aiMode === 'rewriter') {
            showResponse(`[Rewriter Mode - Fallback]\n\n**Improved version of your selected text:**\n\n"${selectedText}"\n\n**Suggested improvements:**\n• Fix grammar and spelling\n• Use more professional tone\n• Add specific details and examples\n• Structure with clear paragraphs\n\n[Note: Enable Chrome Built-in AI flags for full rewriting functionality]`);
          }
        }
      } else {
        // Preview mode: synthesize a mock response
        await new Promise(r => setTimeout(r, 400));
        showResponse(`[Preview] ${aiMode === 'writer' ? 'Writer' : 'Rewriter'} response would appear here.`);
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
