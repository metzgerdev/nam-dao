export interface Metric {
  label: string;
  value: string;
}

export interface Project {
  slug: string;
  name: string;
  tagline: string;
  kind: "ai" | "craft";
  featured: boolean;
  status?: string;
  repo?: string;
  demo?: string;
  stack: string[];
  metrics: Metric[];
  /**
   * Verbatim copy from the GitHub profile README
   * (github.com/metzgerdev/metzgerdev). Keep it that way — the profile is the
   * single source for how these projects are described, so edit it there and
   * mirror the change here rather than writing new prose in this file.
   */
  description: string[];
}

const GITHUB = "https://github.com/metzgerdev";

export const projects: Project[] = [
  {
    slug: "midi-gpt",
    name: "Midi GPT",
    tagline: "A small language model that generates MIDI for electronic music",
    kind: "ai",
    featured: true,
    repo: `${GITHUB}/midi_gpt`,
    stack: ["Python", "PyTorch", "mido", "librosa", "NumPy", "SciPy", "uv"],
    metrics: [
      { label: "Parameters", value: "0.687M" },
      { label: "Output", value: "8 bars" },
      { label: "Inference", value: "CPU, seconds" },
      { label: "Grid", value: "1/16 note" },
    ],
    description: [
      "I built a small language model using a GPT-2 transformer architecture that generates MIDI from a drum loop and key as the prompt. The model is trained on a corpus of MIDI patterns from house and UK garage. The corpus was expanded deterministically to generate additional synthetic data for training. I then performed SFT and DPO to fine-tune the model to my personal taste. A DPO script is provided so the end user can perform additional fine-tuning.",
      "Because MIDI is a compact symbolic representation of music, the model is small enough to run inference on CPU in a couple of seconds. It has 0.687M parameters and writes eight bars in a few seconds. A 1/16 note grid and drum conditioning results in a tight rhythmic lock.",
    ],
  },
  {
    slug: "rag-pipeline",
    name: "RAG Pipeline",
    tagline: "A retrieval test bench for long documents",
    kind: "ai",
    featured: true,
    repo: `${GITHUB}/rag-pipeline`,
    stack: [
      "Python",
      "FAISS",
      "OpenAI text-embedding-3-large",
      "BGE-large",
      "BM25",
      "Jupyter",
    ],
    metrics: [
      { label: "Experiments", value: "27" },
      { label: "Chunking", value: "3" },
      { label: "Embeddings", value: "3" },
      { label: "Retrievers", value: "3" },
    ],
    description: [
      "I built a RAG pipeline for retrieval of long documents like SEC 10-Ks. I ran 27 experiments across combinations of chunking strategies (sentence, sliding-window, semantic), embeddings (text-embedding-3-large, bge-large, bge-small) and retrieval methods (BM25, dense, hybrid/RRF). Eval metrics include Recall@K, Precision@K, MRR, MAP, nDCG and latency.",
      "I generated synthetic QA datasets per chunking configuration with an automated evaluation framework to determine the optimum configuration.",
    ],
  },
  {
    slug: "digital-clone",
    name: "Digital Clone Agent",
    tagline: "A multi-agent email responder that grades its own work",
    kind: "ai",
    featured: true,
    status: "In progress — phases 0 and 1 complete",
    repo: `${GITHUB}/digital-clone`,
    stack: ["LangGraph", "Claude", "BGE-large", "FAISS", "Python"],
    metrics: [
      { label: "Style corpus", value: "~8,900 emails" },
      { label: "Agents", value: "4" },
      { label: "Grounding", value: "4 textbooks" },
    ],
    description: [
      "A LangGraph system that answers a question in the email voice of a real person, grounds every claim in a retrieved knowledge base, evaluates its own output, and books a call instead of guessing when confidence is low.",
      "The style agent builds a profile plus nearest exemplar emails for the author, using the Enron corpus. The knowledge agent runs semantic search with BGE-large and FAISS over four cognitive-science textbooks, returning grounded passages with citations. An evaluator then grades each draft on style match, factual grounding and confidence: confident drafts send, weak ones reflect and retry, and unsupported claims trigger an offer to book a call.",
    ],
  },
  {
    slug: "rag-pipeline-research",
    name: "RAG Research Assistant",
    tagline: "RAG over arXiv papers",
    kind: "ai",
    featured: false,
    repo: `${GITHUB}/rag-pipeline-research`,
    stack: [
      "Python",
      "FAISS",
      "BGE / E5 embeddings",
      "BM25",
      "OpenAI / OpenRouter",
      "Pydantic",
      "Streamlit",
    ],
    metrics: [
      { label: "Chunking", value: "3" },
      { label: "Embeddings", value: "2" },
      { label: "Retrievers", value: "2" },
      { label: "Judge rubric", value: "4 dimensions" },
    ],
    description: [
      "I built a RAG-based research assistant ingesting arXiv papers using the open_ragbench dataset. Multiple experiments are run with configurations based on 3 chunking strategies × 2 embeddings × 2 retrievers. I use an LLM-as-Judge to evaluate the generated answers based on a four-dimensional rubric. Additionally, a Streamlit web UI allows execution of the entire pipeline.",
    ],
  },
  {
    slug: "llm-resume-coach",
    name: "LLM Resume Coach",
    tagline: "Two scorers on the same rubric",
    kind: "ai",
    featured: false,
    repo: `${GITHUB}/llm-resume-coach`,
    stack: ["Python", "Groq (Llama)", "Pydantic", "REST API", "Streamlit"],
    metrics: [{ label: "Scorers", value: "2" }],
    description: [
      "I built a resume coach using synthetic data, a rule-based analyzer, and LLM-as-a-Judge evaluation. The system identifies the fit between a resume and job posting, detects quality issues, and provides actionable feedback.",
      "The evaluation pipeline includes data validation and correlation matrices with heatmaps. The system also exposes an API for running the pipeline.",
    ],
  },
  {
    slug: "synthetic-data-pipeline",
    name: "Synthetic Data Pipeline",
    tagline: "Synthetic Q&A with a calibrated judge",
    kind: "ai",
    featured: false,
    repo: `${GITHUB}/synthetic-data-pipeline`,
    stack: [
      "Python",
      "Groq (Llama 3.3 70B / 3.1 8B)",
      "Pydantic",
      "sentence-transformers",
      "SQLite",
      "Streamlit",
      "Matplotlib",
    ],
    metrics: [{ label: "Quality dimensions", value: "6" }],
    description: [
      "I built a pipeline for synthetic data generation for a Q&A repair chatbot. The pipeline generates structured repair guidance evaluated for data quality, along with human-in-the-loop labeling. The evaluation metric is LLM-as-Judge agreement with human labeling over six quality dimensions. The generation prompt and judge prompt are iterated until the agreement threshold is met. Visualizations, metrics and log reports are generated to guide prompt adjustment based on empirical observations.",
    ],
  },
  {
    slug: "sequencer",
    name: "Sequencer",
    tagline: "A TR-909 step sequencer with the audio engine kept out of React",
    kind: "craft",
    featured: false,
    demo: "#/sequencer",
    repo: `${GITHUB}/nam-dao`,
    stack: ["Web Audio API", "React 19", "TypeScript"],
    metrics: [
      { label: "Lookahead", value: "25ms" },
      { label: "Schedule ahead", value: "100ms" },
      { label: "Steps", value: "16" },
    ],
    description: [
      "A hardware-inspired step sequencer where timing, scheduling and sample triggering run entirely through the Web Audio API, deliberately decoupled from the React render cycle.",
      "The scheduler wakes every 25ms and queues any step falling inside a 100ms horizon, so playback is unaffected by a slow render, a state update or a dropped frame. The visual playhead reads the engine, never the other way round.",
    ],
  },
  {
    slug: "music-player",
    name: "Music Player",
    tagline: "A player with a K-weighted VU meter and a mock GraphQL layer",
    kind: "craft",
    featured: false,
    demo: "#/music-player",
    repo: `${GITHUB}/nam-dao`,
    stack: ["GraphQL", "TanStack Query", "Web Audio API", "React 19"],
    metrics: [
      { label: "Data layer", value: "mock GraphQL" },
      { label: "Metering", value: "K-weighted" },
    ],
    description: [
      "A player for my own music, built against a mock GraphQL layer instead of static imports so the data flow resembles something production-shaped. Requests go to /graphql and resolve client-side against a real local schema, with TanStack Query handling caching, loading and async state.",
      "The meter computes RMS energy and runs the signal through a K-weighted IIR filter chain rather than reading peaks. K-weighting is the curve used in broadcast loudness standards because it tracks human loudness perception.",
    ],
  },
];

export const featuredProjects = projects.filter((p) => p.featured);
export const aiProjects = projects.filter((p) => p.kind === "ai");
export const craftProjects = projects.filter((p) => p.kind === "craft");

export function projectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
