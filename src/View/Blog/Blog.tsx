import { useEffect, useState } from "react";
import { articles } from "./articles";
import BlogArticle from "./BlogArticle";
import "./Blog.css";

function readSelectedSlug(): string | null {
  const hash = window.location.hash.replace(/^#\/?/, "");
  const segments = hash.split("/").filter(Boolean);
  if (segments[0] !== "blog") {
    return null;
  }
  return segments[1] ?? null;
}

function Blog() {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(readSelectedSlug);

  useEffect(() => {
    function syncSlug() {
      setSelectedSlug(readSelectedSlug());
    }

    window.addEventListener("hashchange", syncSlug);
    window.addEventListener("popstate", syncSlug);
    return () => {
      window.removeEventListener("hashchange", syncSlug);
      window.removeEventListener("popstate", syncSlug);
    };
  }, []);

  const selected =
    selectedSlug === null
      ? null
      : (articles.find((article) => article.slug === selectedSlug) ?? null);

  if (selected) {
    return (
      <BlogArticle
        article={selected}
        onBack={() => {
          window.location.hash = "#/blog";
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
                <a className="blog-card-link" href={`#/blog/${article.slug}`}>
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
