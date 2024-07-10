// background.js

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({
      text: 'OFF'
  });
});

const extensions = 'https://www.amazon.com';

async function executeScriptOnTab(tabId, scriptFunction) {
  const result = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: scriptFunction
  });

  return result && result.length > 0 ? result[0].result : null;
}

// Function to highlight elements based on text strings
async function highlightElements(tabId, textStrings) {
    for (const textString of textStrings) {
        // Find elements with the specified text content and highlight them
        const elements = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            function: (text) => {
                const elements = document.evaluate(`//*[contains(text(), "${text}")]`, document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
                const highlightedElements = [];
                for (let i = 0; i < elements.snapshotLength; i++) {
                    const element = elements.snapshotItem(i);
                    element.style.border = '4px solid red'; // Change the border style to highlight the element
                    element.style.backgroundColor = 'aqua'; // Change the border style to highlight the element
                    highlightedElements.push(element.innerText.trim());
                }
                return highlightedElements;
            },
            args: [textString]
        });
    }
}

async function sendDataToServer(data, tabId) {
  const serverUrl = 'http://127.0.0.1:5000'; // Adjust the URL based on your server

  try {
      const response = await fetch(serverUrl, {
          method: 'POST',
          headers: {
              'Content-Type': 'text/plain',
          },
          body: data,
      });

      console.log('Request sent successfully');

      if (response.ok) {
          const responseData = await response.json();
          console.log(responseData);

          chrome.runtime.sendMessage({ command: 'showResults', data: responseData });
          // Iterate through responseData and highlight elements for each category
          for (const category in responseData) {
            const info = responseData[category];
            if (info.count > 0) {
                await highlightElements(tabId, info.text_strings);
            }
        }

        console.log('Elements highlighted based on responseData');
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
//   console.log(tab.id)

  const prevState = await chrome.action.getBadgeText({ tabId: tab.id });
  const nextState = prevState === 'ON' ? 'OFF' : 'ON';

  await chrome.action.setBadgeText({
      tabId: tab.id,
      text: nextState
  });

  if (nextState === 'ON') {
    const resultRightCol = await executeScriptOnTab(tab.id, () => {
        const targetElement = document.getElementById('rightCol');
        return targetElement ? targetElement.innerText.trim() : null;
    });

    const resultCenterCol = await executeScriptOnTab(tab.id, () => {
        const targetElement = document.getElementById('centerCol');
        return targetElement ? targetElement.innerText.trim() : null;
    });

    const resultSelectQuantity = await executeScriptOnTab(tab.id, () => {
        const targetElement = document.getElementById('selectQuantity');
        return targetElement ? targetElement.innerText.trim() : null;
    });

    const resultFeatureBullets = await executeScriptOnTab(tab.id, () => {
        const targetElement = document.getElementById('feature-bullets');
        return targetElement ? targetElement.innerText.trim() : null;
    });

    const resultCard = await executeScriptOnTab(tab.id, () => {
        const targetElements = document.getElementsByClassName('a-section a-spacing-small puis-padding-left-small puis-padding-right-small');
        const textContents = [];
        for (let i = 0; i < 12; i++) {
            textContents.push(targetElements[i].innerText.trim());
        }
        return textContents.join('\n');
    });

    const elementsTextContent = [resultRightCol, resultCenterCol, resultFeatureBullets, resultCard].filter(Boolean).join('\n');
    const joinedTextContent = elementsTextContent.replace(resultSelectQuantity, '');

    console.log(joinedTextContent);

    sendDataToServer(joinedTextContent, tab.id);
}
   else if (nextState === 'OFF') {
      await chrome.scripting.removeCSS({
          files: ['focus-mode.css'],
          target: { tabId: tab.id }
      });
  }
}

// When the user clicks on the extension action
chrome.action.onClicked.addListener(async (tab) => {
  await handleExtensionClick(tab);
});

// Listen for messages from the popup or other components
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === 'detect') {
      chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
          const tab = tabs[0];
          await handleExtensionClick(tab);
      });
  }
});
