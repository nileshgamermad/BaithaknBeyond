export default function ArticleContent({ contentHtml, noteHtml, mapHtml }) {
  return (
    <div className="article-layout">
      <article
        className="article-content"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
      <aside className="article-sidebar">
        <div
          className="article-sidebar__card"
          dangerouslySetInnerHTML={{ __html: noteHtml }}
        />
        <div
          className="article-sidebar__card"
          dangerouslySetInnerHTML={{ __html: mapHtml }}
        />
      </aside>
    </div>
  );
}
