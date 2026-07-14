import { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import type { Article } from "./articles";

const BASE = `${import.meta.env.BASE_URL}blog/`;

function prefixRelative(url: string): string {
  if (!url || url.startsWith("http") || url.startsWith("/") || url.startsWith("#")) {
    return url;
  }
  return `${BASE}${url}`;
}

interface BlogArticleProps {
  article: Article;
  onBack: () => void;
}

function BlogArticle({ article, onBack }: BlogArticleProps) {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [article.slug]);

  return (
    <main className="blog" aria-label="Blog">
      <button type="button" className="blog-back" onClick={onBack}>
        ← All posts
      </button>
      <article className="blog-article">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          urlTransform={prefixRelative}
        >
          {article.content}
        </ReactMarkdown>
      </article>
    </main>
  );
}

export default BlogArticle;
