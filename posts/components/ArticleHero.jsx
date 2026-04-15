export default function ArticleHero({ article, readTimeLabel, publishedLabel }) {
  return (
    <header className="article-hero" data-category={article.category}>
      <div className="article-hero__media">
        <img
          className="article-hero__image"
          src={article.image}
          alt={article.alt}
        />
      </div>
      <div className="article-hero__content">
        <p className="article-hero__eyebrow">{article.categoryLabel}</p>
        <h1 className="article-hero__title">{article.title}</h1>
        <p className="article-hero__dek">{article.dek}</p>
        <div className="article-hero__meta">
          <span>{article.author}</span>
          <span>{publishedLabel}</span>
          <span>{readTimeLabel}</span>
        </div>
        {article.tags?.length > 0 && (
          <div className="article-hero__tags">
            {article.tags.map((tag) => (
              <a key={tag} className="article-hero__tag" href={`../tags/${tag.toLowerCase().replace(/\s+/g, '-')}/`}>
                {tag}
              </a>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
