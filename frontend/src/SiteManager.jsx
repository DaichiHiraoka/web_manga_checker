import { useState, useEffect } from 'react';

function SiteManager() {
    const [sites, setSites] = useState([]);
    const [newSite, setNewSite] = useState('');
    const [error, setError] = useState(null);

    const fetchSites = () => {
        fetch('http://127.0.0.1:3000/api/sites')
            .then(response => response.json())
            .then(data => setSites(data))
            .catch(err => {
                console.error("Error fetching sites:", err);
                setError("Could not fetch monitored sites.");
            });
    };

    useEffect(() => {
        fetchSites();
    }, []);

    const handleAddSite = (e) => {
        e.preventDefault();
        if (!newSite.trim()) return;

        fetch('http://127.0.0.1:3000/api/sites', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ domain: newSite.trim() }),
        })
        .then(response => {
            if (response.ok) {
                setNewSite('');
                fetchSites(); // Refresh the list
            } else {
                response.text().then(text => {
                    setError(`Failed to add site: ${text}`);
                });
            }
        })
        .catch(err => {
            console.error("Error adding site:", err);
            setError("Could not add the new site.");
        });
    };

    const handleDeleteSite = (id) => {
        fetch(`http://127.0.0.1:3000/api/sites/${id}`, {
            method: 'DELETE',
        })
        .then(response => {
            if (response.ok) {
                fetchSites(); // Refresh the list
            } else {
                response.text().then(text => {
                    setError(`Failed to delete site: ${text}`);
                });
            }
        })
        .catch(err => {
            console.error("Error deleting site:", err);
            setError("Could not delete the site.");
        });
    };

    return (
        <div className="SiteManager">
            <h2>Monitored Sites</h2>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleAddSite}>
                <input
                    type="text"
                    value={newSite}
                    onChange={(e) => setNewSite(e.target.value)}
                    placeholder="e.g., example.com"
                />
                <button type="submit">Add Site</button>
            </form>
            <ul>
                {sites.map(site => (
                    <li key={site.id}>
                        {site.domain}
                        <button onClick={() => handleDeleteSite(site.id)} className="delete-btn">
                            &times;
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default SiteManager;
