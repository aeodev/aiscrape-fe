/**
 * Main App Component
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ScraperPage } from './pages/ScraperPage/ScraperPage';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ScraperPage />} />
      </Routes>
    </Router>
  );
};

export default App;


