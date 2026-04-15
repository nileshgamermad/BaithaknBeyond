import { useEffect, useMemo, useRef } from 'react';
import ArticleHero from './components/ArticleHero.jsx';
import ArticleContent from './components/ArticleContent.jsx';
import ReadingProgress from './components/ReadingProgress.jsx';
import SaveButton from './components/SaveButton.jsx';

function getReadTimeLabel(html) {
  const plainText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = plainText ? plainText.split(' ').length : 0;
  const minutes = Math.max(1, Math.ceil(wordCount / 200));
  return `${minutes} min read`;
}

function getPublishedLabel(publishedAt) {
  const parsed = publishedAt ? new Date(publishedAt) : new Date(document.lastModified);
  if (Number.isNaN(parsed.getTime())) return 'Recently updated';

  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function ArticleApp({ article, contentHtml, noteHtml, mapHtml, relatedHtml }) {
  const articleRef = useRef(null);
  const readTimeLabel = useMemo(() => getReadTimeLabel(contentHtml), [contentHtml]);
  const publishedLabel = useMemo(() => getPublishedLabel(article.publishedAt), [article.publishedAt]);

  useEffect(() => {
    document.body.dataset.theme = localStorage.getItem('baithak-theme') || 'light';
  }, []);

  return (
    <>
      <ReadingProgress targetRef={articleRef} />
      <main className="article-page">
        <div className="article-page__chrome">
          <a className="article-back-link" href="../">
            Back to homepage
          </a>
          <SaveButton storyId={article.storyId} />
        </div>

        <ArticleHero
          article={article}
          readTimeLabel={readTimeLabel}
          publishedLabel={publishedLabel}
        />

        <section className="article-main-shell" ref={articleRef}>
          <ArticleContent
            contentHtml={contentHtml}
            noteHtml={noteHtml}
            mapHtml={mapHtml}
          />
        </section>

        <section
          className="article-related"
          dangerouslySetInnerHTML={{ __html: relatedHtml }}
        />
      </main>

      <button className="theme-switch" type="button" id="themeSwitch" aria-label="Toggle theme">
        <span className="switch-track"><span className="switch-thumb" /></span>
        <span id="themeLabel">Dark mode</span>
      </button>
    </>
  );
}
