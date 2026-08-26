import musicGenContent from "./blog_post.md?raw";
import midiGptContent from "./midi_gpt_post.md?raw";

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
    slug: "midi-gpt",
    title: "Midi GPT: A Model Tuned to My Taste",
    subtitle:
      "A 621k-parameter transformer that writes house and UK garage MIDI, fine-tuned on my own DAW edits with SFT and DPO.",
    date: "August 2026",
    readingTime: "5 min read",
    tags: ["Machine Learning", "Audio", "Fine-tuning"],
    cover: `${BLOG_BASE}midi-gpt/sft-preference-shift.png`,
    content: midiGptContent,
  },
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
