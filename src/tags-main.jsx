import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import TagPageApp from './TagPageApp.jsx';
import './baithak-home.css';
import './components/CollectionsView.css';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <TagPageApp />
    </StrictMode>
  );
}
