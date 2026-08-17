import { articles } from "./articles";
import BlogArticle from "./BlogArticle";
import { hrefFor } from "../../routing";
import "./Blog.css";

interface BlogProps {
  /** Article slug from the route, when one is open. */
  slug?: string;
}

function Blog({ slug }: BlogProps) {
  // The router owns the slug now, so this view has no URL parsing of its own.
  const selected = slug
    ? (articles.find((article) => article.slug === slug) ?? null)
    : null;

  if (selected) {
    return (
      <BlogArticle
        article={selected}
        onBack={() => {
          window.history.pushState(null, "", hrefFor("blog"));
          window.dispatchEvent(new PopStateEvent("popstate"));
        }}
      />
    );
  }

  return (
    <main className="blog blog-list" aria-label="Blog">
      <header className="blog-list-header">
        <p className="blog-kicker">Writing</p>
        <h1 className="blog-list-title">Blog</h1>
        <p className="blog-list-intro">
          Notes on audio, machine learning, and building creative tools.
        </p>
      </header>

      <ul className="blog-card-grid">
        {articles.map((article) => (
          <li key={article.slug} className="blog-card">
            <div className="blog-card-media">
              <img src={article.cover} alt="" loading="lazy" />
            </div>
            <div className="blog-card-body">
              <div className="blog-card-tags">
                {article.tags.map((tag) => (
                  <span key={tag} className="blog-tag">
                    {tag}
                  </span>
                ))}
              </div>
              <h2 className="blog-card-title">
                <a
                  className="blog-card-link"
                  href={hrefFor(`blog/${article.slug}`)}
                >
                  {article.title}
                </a>
              </h2>
              <p className="blog-card-subtitle">{article.subtitle}</p>
              <div className="blog-card-meta">
                <span>{article.date}</span>
                <span aria-hidden="true">·</span>
                <span>{article.readingTime}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}

export default Blog;
