document.getElementById('close-popup').addEventListener('click', () => {
    window.close();
});

document.addEventListener('DOMContentLoaded', function () {
    const detectButton = document.getElementById('detect-popup');
    const resultContainer = document.getElementById('result-container');

    detectButton.addEventListener('click', async function () {
        // Update button color to indicate detection is in progress
        detectButton.style.backgroundColor = '#ff0000'; // Use your desired color

        // Show "Detecting..." in result-container
        resultContainer.innerHTML = 'Detecting...';

        chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
            const activeTab = tabs[0];

            // Send a message to the background script to trigger the detection
            chrome.runtime.sendMessage({ command: 'detect', tab: activeTab });
        });
    });
});

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.command === 'showResults') {
        // Display the results in the popup
        displayResults(message.data);

        // Reset button color after detection is complete
        const detectButton = document.getElementById('detect-popup');
        detectButton.style.backgroundColor = '#007bff'; // Use your original button color
    }
});

// Function to display results in the popup
async function displayResults(results) {
    const resultContainer = document.getElementById('result-container');

    // Clear previous results
    resultContainer.innerHTML = '';

    // Iterate through the results and display only if count is not zero
    for (const category in results) {
        const info = results[category];
        if (info.count > 0) {
            const resultItem = document.createElement('div');
            resultItem.classList.add('result-item');

            const categoryTitle = document.createElement('h3');
            categoryTitle.textContent = category;

            const countText = document.createElement('p');
            countText.textContent = `Occurrences: ${info.count}`;

            resultItem.appendChild(categoryTitle);
            resultItem.appendChild(countText);

            resultContainer.appendChild(resultItem);
        }
    }
}
