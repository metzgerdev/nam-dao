import musicGenContent from "./blog_post.md?raw";

const BLOG_BASE = `${import.meta.env.BASE_URL}blog/`;

export interface Article {
  slug: string;
  title: string;
  subtitle: string;
  date: string;
  readingTime: string;
  tags: string[];
  cover: string;
  content: string;
}

export const articles: Article[] = [
  {
    slug: "musicgen-delay-pattern",
    title: "MusicGen: One Stream Instead of Many",
    subtitle:
      "How a simple delay pattern turns parallel codebook streams into a single sequence a next-token model can generate.",
    date: "March 2026",
    readingTime: "6 min read",
    tags: ["Machine Learning", "Audio", "Paper Review"],
    cover: `${BLOG_BASE}audio_rvq_pipeline.png`,
    content: musicGenContent,
  },
];
