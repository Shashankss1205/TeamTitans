chrome.runtime.onInstalled.addListener(() => {
    chrome.action.setBadgeText({ text: 'OFF' });
  });
  
  const extensions = 'https://www.amazon.com';
  
  async function executeScriptOnTab(tabId, scriptFunction) {
    const result = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: scriptFunction
    });
  
    return result && result.length > 0 ? result[0].result : null;
  }
  
  async function highlightElements(tabId, textStrings, category) {
    for (const textString of textStrings) {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: (text, category) => {
          const elements = document.evaluate(`//*[contains(text(), "${text}")]`, document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
          for (let i = 0; i < elements.snapshotLength; i++) {
            const element = elements.snapshotItem(i);
            element.style.border = '4px solid red';
            element.style.backgroundColor = 'aqua';
            element.classList.add('highlighted'); // Add highlighted class
            element.setAttribute('data-category', category); // Set data-category attribute
          }
        },
        args: [textString, category]
      });
    }
  }
  
  
  async function sendDataToServer(data, tabId) {
    const serverUrl = 'http://127.0.0.1:5000';
  
    try {
      const response = await fetch(serverUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: data
      });
  
      if (response.ok) {
        const responseData = await response.json();
        chrome.runtime.sendMessage({ command: 'showResults', data: responseData });
  
        for (const category in responseData) {
          const info = responseData[category];
          if (info.count > 0) {
            await highlightElements(tabId, info.text_strings, category);
          }
        }
      } else {
        console.error('Error receiving response from the server');
      }
    } catch (error) {
      console.error('Error sending request:', error);
    }
  }
  
  async function handleExtensionClick(tab) {
    if (!tab.url.startsWith(extensions)) {
      return;
    }
  
    const prevState = await chrome.action.getBadgeText({ tabId: tab.id });
    const nextState = prevState === 'ON' ? 'OFF' : 'ON';
  
    await chrome.action.setBadgeText({ tabId: tab.id, text: nextState });
  
    if (nextState === 'ON') {
      const elementsTextContent = await executeScriptOnTab(tab.id, () => {
        const targetElements = [
          document.getElementById('rightCol'),
          document.getElementById('centerCol'),
          document.getElementById('feature-bullets'),
          ...Array.from(document.getElementsByClassName('a-section a-spacing-small puis-padding-left-small puis-padding-right-small'))
        ].filter(Boolean);
  
        return targetElements.map(el => el.innerText.trim()).join('\n');
      });
  
      sendDataToServer(elementsTextContent, tab.id);
    } else if (nextState === 'OFF') {
      await chrome.scripting.removeCSS({ files: ['focus-mode.css'], target: { tabId: tab.id } });
    }
  }
  
  chrome.action.onClicked.addListener(async (tab) => {
    await handleExtensionClick(tab);
  });
  
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.command === 'detect') {
      chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
        const tab = tabs[0];
        await handleExtensionClick(tab);
      });
    }
  });
  