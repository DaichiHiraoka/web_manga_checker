// Try to find a more specific title, falling back to the document title.
const h1 = document.querySelector('h1');
const title = h1 ? h1.textContent.trim() : document.title;

// Send the found title and the page's URL to the background script.
// We don't do any logic here, just send the data.
// The background script will decide if it needs to be logged.
chrome.runtime.sendMessage({
    type: 'LOG_HISTORY',
    payload: {
        title: title,
        url: window.location.href
    }
});
