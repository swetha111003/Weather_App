import React from 'react';
import Weather from './components/Weather';
import './App.css';

function App() {
  return (
    <div className="App" style={{ width: '100%', height: '100%', margin: 0, padding: 0 }}>
      <Weather />
    </div>
  );
}

export default App;