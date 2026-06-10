import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import blogContent from "./blog_post.md?raw";
import "./Blog.css";

const BASE = `${import.meta.env.BASE_URL}blog/`;

function prefixRelative(url: string): string {
  if (!url || url.startsWith("http") || url.startsWith("/") || url.startsWith("#")) {
    return url;
  }
  return `${BASE}${url}`;
}

function Blog() {
  return (
    <main className="blog" aria-label="Blog">
      <article className="blog-article">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          urlTransform={prefixRelative}
        >
          {blogContent}
        </ReactMarkdown>
      </article>
    </main>
  );
}

export default Blog;
