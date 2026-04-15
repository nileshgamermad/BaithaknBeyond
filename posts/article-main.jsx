import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ArticleApp from './article-app.jsx';
import './blog.css';
import './theme.js';

const root = document.getElementById('article-root');
const articleDataNode = document.getElementById('article-data');
const articleBodyNode = document.getElementById('article-body');
const articleNoteNode = document.getElementById('article-note');
const articleMapNode = document.getElementById('article-map');

if (root && articleDataNode && articleBodyNode && articleNoteNode && articleMapNode) {
  const article = JSON.parse(articleDataNode.textContent || '{}');

  createRoot(root).render(
    <StrictMode>
      <ArticleApp
        article={article}
        contentHtml={articleBodyNode.innerHTML}
        noteHtml={articleNoteNode.innerHTML}
        mapHtml={articleMapNode.innerHTML}
      />
    </StrictMode>
  );
}
