import { useState, useEffect } from 'react';
import './App.css';
import SiteManager from './SiteManager'; // Import the new component

function App() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSite, setSelectedSite] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [uniqueSites, setUniqueSites] = useState([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = () => {
    fetch('http://127.0.0.1:3000/api/history')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setHistory(data);
        const sites = [...new Set(data.map(entry => new URL(entry.url).origin))];
        setUniqueSites(['all', ...sites]);
        setLoading(false);
      })
      .catch(error => {
        setError(error);
        setLoading(false);
      });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  const filteredHistory = history.filter(entry => {
    const entryDate = new Date(entry.timestamp);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    const matchesSite = selectedSite === 'all' || new URL(entry.url).origin === selectedSite;
    const matchesStartDate = !start || entryDate >= start;
    const matchesEndDate = !end || entryDate < new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1);

    return matchesSite && matchesStartDate && matchesEndDate;
  });

  const handleDelete = async (id) => {
    const numericId = Number(id); // Ensure id is a number
    console.log('Attempting to delete history entry with ID:', numericId);
    try {
      const response = await fetch(`http://127.0.0.1:3000/api/history/${numericId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete history entry: ${response.status} ${response.statusText} - ${errorText}`);
      }
      console.log('Deletion successful for ID:', numericId);
      setHistory(prevHistory => {
        const newHistory = prevHistory.filter(entry => {
          console.log(`Comparing entry.id (${entry.id}) with numericId (${numericId})`);
          return entry.id !== numericId;
        });
        console.log('Previous history:', prevHistory);
        console.log('New history after filter:', newHistory);
        return newHistory;
      });
    } catch (error) {
      console.error('Error deleting history entry:', error);
      setError(error);
    }
  };

  return (
    <div className="App">
      <h1>Web Manga Reading History</h1>
      
      <SiteManager />

      <h2>History</h2>
      <div>
        <label htmlFor="site-filter">Filter by Site:</label>
        <select id="site-filter" onChange={(e) => setSelectedSite(e.target.value)} value={selectedSite}>
          {uniqueSites.map(site => (
            <option key={site} value={site}>
              {site === 'all' ? 'All Sites' : site}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="start-date">Start Date:</label>
        <input type="date" id="start-date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      </div>
      <div>
        <label htmlFor="end-date">End Date:</label>
        <input type="date" id="end-date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>
      {filteredHistory.length === 0 ? (
        <p>No history found for the selected site.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>URL</th>
              <th>Timestamp</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.map(entry => (
              <tr key={entry.id}>
                <td>{entry.title}</td>
                <td><a href={entry.url} target="_blank" rel="noopener noreferrer">{entry.url}</a></td>
                <td>{new Date(entry.timestamp).toLocaleString()}</td>
                <td>
                  <button onClick={() => handleDelete(entry.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;