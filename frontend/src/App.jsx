import { useState, useEffect } from 'react';
import './App.css';
import SiteManager from './SiteManager'; // Import the new component

function App() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://127.0.0.1:3000/api/history')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setHistory(data);
        setLoading(false);
      })
      .catch(error => {
        setError(error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="App">
      <h1>Web Manga Reading History</h1>
      
      <SiteManager />

      <h2>History</h2>
      {history.length === 0 ? (
        <p>No history found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>URL</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {history.map(entry => (
              <tr key={entry.id}>
                <td>{entry.title}</td>
                <td><a href={entry.url} target="_blank" rel="noopener noreferrer">{entry.url}</a></td>
                <td>{new Date(entry.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;
