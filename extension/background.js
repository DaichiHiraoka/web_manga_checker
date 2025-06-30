// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // We only care about LOG_HISTORY messages
    if (message.type === 'LOG_HISTORY') {
        const { title, url } = message.payload;

        // Ignore special browser pages
        if (url.startsWith('chrome://') || url.startsWith('about:')) {
            return;
        }

        // Check if the site is monitored before logging
        const checkUrl = `http://127.0.0.1:3000/api/is_monitored?url=${encodeURIComponent(url)}`;

        fetch(checkUrl)
            .then(response => response.json())
            .then(data => {
                if (data.is_monitored) {
                    console.log(`Monitored site detected: ${title} (${url})`);
                    logHistory(title, url);
                }
            })
            .catch(error => {
                console.error('Error checking if site is monitored:', error);
            });
    }
});

function logHistory(title, url) {
    fetch('http://127.0.0.1:3000/api/log', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            title: title,
            url: url,
        }),
    })
    .then(response => {
        if (!response.ok) {
            console.error('Failed to log data:', response.status, response.statusText);
        }
    })
    .catch(error => {
        console.error('Error sending data to backend:', error);
    });
}
