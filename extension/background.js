chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.title) {
        // Ignore special browser pages
        if (tab.url.startsWith('chrome://') || tab.url.startsWith('about:')) {
            return;
        }

        // Check if the site is monitored before logging
        const checkUrl = `http://127.0.0.1:3000/api/is_monitored?url=${encodeURIComponent(tab.url)}`;

        fetch(checkUrl)
            .then(response => response.json())
            .then(data => {
                if (data.is_monitored) {
                    console.log(`Monitored site detected: ${tab.title} (${tab.url})`);
                    logHistory(tab);
                }
            })
            .catch(error => {
                console.error('Error checking if site is monitored:', error);
            });
    }
});

function logHistory(tab) {
    fetch('http://127.0.0.1:3000/api/log', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            title: tab.title,
            url: tab.url,
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
