export interface Metric {
  label: string;
  value: string;
}

export interface Section {
  heading: string;
  body?: string[];
  list?: string[];
}

export interface Project {
  slug: string;
  name: string;
  tagline: string;
  year: string;
  kind: "ai" | "craft";
  featured: boolean;
  status?: string;
  repo?: string;
  demo?: string;
  stack: string[];
  metrics: Metric[];
  summary: string;
  sections: Section[];
}

const GITHUB = "https://github.com/metzgerdev";

export const projects: Project[] = [
  {
    slug: "midi-gpt",
    name: "midi_gpt",
    tagline: "A 0.687M-parameter language model that writes basslines",
    year: "2026",
    kind: "ai",
    featured: true,
    repo: `${GITHUB}/midi_gpt`,
    stack: ["PyTorch", "GPT-2", "SFT", "DPO", "mido", "librosa", "NumPy"],
    metrics: [
      { label: "Parameters", value: "0.687M" },
      { label: "Inference", value: "CPU, ~2s" },
      { label: "Output", value: "8 bars" },
      { label: "Training set", value: "7,704 chunks" },
    ],
    summary:
      "A small GPT-2 that takes a drum loop, a BPM and an optional chord progression, and returns eight bars of bass and melody. Small enough to run on CPU, fine-tuned with SFT and DPO so the output matches a specific taste.",
    sections: [
      {
        heading: "The problem",
        body: [
          "A blank DAW session is the hardest part of producing. Music tends to grow out of a short, catchy loop — so the useful intervention is not a finished track, it is a starting point that already sounds like you.",
          "I generate MIDI rather than audio on purpose. MIDI keeps a human in the loop: the producer still owns arrangement and sound design, and because the DAW renders the audio, there is no generative-codec ceiling on fidelity. It also makes the model small enough to run locally in a couple of seconds.",
        ],
      },
      {
        heading: "Building the training corpus",
        body: [
          "The note models were trained on MIDI mined from a 19,356-file multitrack corpus. Selection runs on filename and path, then content-hash dedup:",
        ],
        list: [
          "19,356 MIDI files in the raw corpus",
          "6,637 filename matches for bass (plus arp, pluck, lead, melody, keys for the arp role)",
          "1,483 with UK garage, garage or 2-step in the path",
          "393 unique after content-MD5 dedup",
          "354 that yielded at least one usable chunk",
        ],
      },
      {
        heading: "Normalisation",
        body: [
          "Each surviving file is merged across tracks, note-ons paired with note-offs, and quantised to a sixteenth grid. Then it is mono-reduced — lowest note for bass, so a reese stack collapses to its fundamental; highest for arp, so a chord keeps its top line. Pitches are octave-shifted so the median sits near E2 for bass and C4 for arp, then split into 4-bar, 64-step chunks. Chunks with fewer than three notes are dropped.",
        ],
      },
      {
        heading: "Forcing the model to read the chord track",
        body: [
          "Both conditioning signals are self-supervised. The onset grid is the stem's own note-ons. The chord chroma is inferred per bar by counting pitch classes and scoring that histogram against 72 chord templates.",
          "The important trick is what happens next. Every chunk is written twelve times, transposed through all keys, with the notes and the chroma rotated together. Across those twelve copies the rhythm is identical and only the chroma predicts which pitches appear — so absolute pitch carries no information at all, and the model has no choice but to condition on the chord track. Measured over the finished corpus, the pitch-class distribution is flat to within 2% of uniform.",
          "The result is 4,248 bass and 3,456 arp examples, each an .npz holding tokens (64,), grid (64,) and chord (64, 12).",
        ],
      },
      {
        heading: "Training",
        body: [
          "Supervised fine-tuning first, then Direct Preference Optimization to pull the output toward my own taste. The DPO script ships with the repo, so anyone cloning it can re-tune the model to their preferences rather than inheriting mine.",
        ],
      },
      {
        heading: "What I would flag in review",
        body: [
          "Two properties of the corpus are worth stating plainly. The source corpus was already transposed to twelve keys before I mined it, and content-hash dedup cannot detect a transposition — so roughly 151 distinct songs sit behind the 354 nominally unique sources.",
          "And the chord labels come from a monophonic line. In 35% of bars the template matcher sees a single pitch class, where many templates tie and the winner is decided by enumeration order. Both of these cap how much the numbers above can be trusted, and both are things I would want to fix before claiming the model generalises.",
        ],
      },
    ],
  },
  {
    slug: "electronic-lora",
    name: "electronic-lora",
    tagline:
      "A genre adapter for ACE-Step, trained on a hand-labeled house core",
    year: "2026",
    kind: "ai",
    featured: true,
    repo: `${GITHUB}/electronic-lora`,
    stack: ["ACE-Step 1.5", "LoKr", "DoRA", "librosa", "Streamlit", "Colab"],
    metrics: [
      { label: "Curated set", value: "57 tracks" },
      { label: "Adapter", value: "LoKr dim 64" },
      { label: "Schedule", value: "100 epochs" },
      { label: "Trigger", value: "zynarai" },
    ],
    summary:
      "Training a genre LoRA for ACE-Step 1.5 on a 57-track instrumental house core, curated and expert-labeled from a personal DJ collection — built around a specific thesis about how training captions actually work.",
    sections: [
      {
        heading: "The pipeline",
        body: [
          "161 tracks from a personal DJ collection go through triage on tags, bitrate and duration, leaving 159. An autocaption pass combines librosa features with ID3 tags and artist knowledge to draft captions. Genre, BPM and vocal gates then cut that to a 57-track instrumental core.",
          "That core gets contrastive re-captioning with quartile-assigned axis phrases, then passes through a Streamlit click-to-label app driven by a controlled vocabulary schema. The signed-off dataset.json is the single source of truth for training.",
          "Training runs on Colab Pro L4: LoKr at dim 64 with DoRA, 100 epochs. A separate VAE round-trip notebook establishes the codec ceiling, which sets a realistic quality budget for what the adapter can be expected to achieve.",
        ],
      },
      {
        heading: "Captions are coordinates",
        body: [
          "The design thesis is that a training caption assigns each track a set of coordinates in the model's conditioning space. Four rules follow from that:",
        ],
        list: [
          "Constants belong to the trigger word — a phrase that appears on nearly every track teaches nothing, so zynarai absorbs whatever the whole set shares.",
          "Descriptors carry only within-dataset variance — measured axes (dynamics, brightness, percussion density, low-end weight) label only the top and bottom quartile, and the middle stays silent.",
          "Separation should be proportional to audible difference — a false or diluted descriptor bends the axis for every other track that uses it.",
          "One concept, one exact phrase — the controlled vocabulary is enforced by the labeling app rather than by discipline.",
        ],
      },
      {
        heading: "Status and rights",
        body: [
          "v1 is a private pipeline shakedown trained on commercial tracks, with the audio deliberately untracked for rights reasons. v2 will be a publishable model trained on original productions under my own artist name, Zynar.",
        ],
      },
    ],
  },
  {
    slug: "rag-pipeline",
    name: "rag-pipeline",
    tagline: "A 24-experiment benchmark of chunking against retrieval",
    year: "2026",
    kind: "ai",
    featured: true,
    repo: `${GITHUB}/rag-pipeline`,
    stack: ["FAISS", "BGE", "BM25", "RRF", "OpenRouter", "Jupyter"],
    metrics: [
      { label: "Grid", value: "24 experiments" },
      { label: "Chunkers", value: "3" },
      { label: "Retrievers", value: "4" },
      { label: "Metrics", value: "6" },
    ],
    summary:
      "A RAG evaluation harness that benchmarks three chunking strategies against four retrieval methods on real documents, scored on the full IR metric set rather than on vibes.",
    sections: [
      {
        heading: "Why an evaluation pipeline first",
        body: [
          "Most RAG advice is asserted rather than measured. Before building a retrieval system worth trusting, I wanted a harness that could tell me which combination of choices actually wins on a given corpus — and by how much.",
        ],
      },
      {
        heading: "The grid",
        list: [
          "Parse — a PDF is split into text and table chunks",
          "Chunk — three strategies: sentence, sliding window, semantic",
          "Generate — a synthetic QA eval set at mixed difficulty: direct, paraphrased, inferential",
          "Retrieve — four methods: BM25 keyword baseline, dense BGE + FAISS, hybrid RRF fusion, and LLM cross-encoder reranking",
          "Evaluate — the 24-cell grid scored on Recall@K, Precision@K, MRR, MAP, NDCG@K and latency",
          "Answer — retrieved chunks and question go to an LLM via OpenRouter for a grounded answer with source citations",
        ],
      },
      {
        heading: "The point of the latency column",
        body: [
          "Reranking wins on relevance almost by construction. Carrying latency through the same grid is what makes the results usable as an engineering decision rather than a leaderboard — the interesting question is which cells buy enough quality to justify what they cost.",
        ],
      },
    ],
  },
  {
    slug: "digital-clone",
    name: "digital-clone",
    tagline: "A multi-agent email responder that grades its own work",
    year: "2026",
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
    summary:
      "A LangGraph system that answers a question in the email voice of a real person, grounds every claim in a retrieved knowledge base, evaluates its own output, and books a call instead of guessing when confidence is low.",
    sections: [
      {
        heading: "How it works",
        list: [
          "Style Agent — builds a profile plus nearest exemplar emails for the author. The corpus is Enron, profiling Kay Mann, its most prolific sender at roughly 8,900 sent emails.",
          "Knowledge Agent — semantic search with BGE-large and FAISS over four cognitive-science textbooks, returning grounded passages with citations.",
          "Drafting — states the retrieved facts in the author's voice, with citations attached.",
          "Evaluator — grades the draft on style match, factual grounding and confidence.",
          "Fallback — confident drafts send; weak ones reflect and retry; unsupported claims trigger an offer to book a call.",
        ],
      },
      {
        heading: "The interesting constraint",
        body: [
          "Voice cloning and factual grounding pull against each other: the more strongly you condition on someone's writing style, the more the model wants to produce confident-sounding text regardless of what retrieval returned. Separating style and knowledge into different agents, then scoring both independently in the evaluator, is what keeps a convincing voice from laundering an unsupported claim.",
          'The escape hatch matters as much as the pipeline. A system that says "I am not sure, here is a calendar link" is more useful in production than one that always answers.',
        ],
      },
      {
        heading: "Current status",
        body: [
          "The style extractor, profiler and knowledge agent are complete. Style-conditioned drafting, the evaluator, the orchestrator with calendar fallback, and the demo and evaluation harness are still in progress.",
        ],
      },
    ],
  },
  {
    slug: "vocal-emotion-finetune",
    name: "vocal-emotion-finetune",
    tagline: "Adapting a speech encoder to perceived vocal emotion",
    year: "2026",
    kind: "ai",
    featured: true,
    repo: `${GITHUB}/vocal-emotion-finetune`,
    stack: ["WavLM", "PyTorch", "RAVDESS", "uv"],
    metrics: [
      { label: "Baseline macro F1", value: "0.480" },
      { label: "Adapted macro F1", value: "0.607" },
      { label: "Baseline UAR", value: "0.492" },
      { label: "Adapted UAR", value: "0.613" },
    ],
    summary:
      "Research on adapting a pretrained WavLM encoder to recognise perceived vocal emotion, targeting categorical probabilities alongside continuous valence/arousal/dominance and calibrated uncertainty.",
    sections: [
      {
        heading: "Result",
        body: [
          "A frozen WavLM Base+ baseline reaches 0.4802 test macro F1 and 0.4922 UAR on RAVDESS. Unfreezing and adapting the top two layers moves that to 0.6069 macro F1 and 0.6133 UAR — a gain of roughly 12 points on both metrics from a deliberately small change in what is trainable.",
        ],
      },
      {
        heading: "Why the splits matter",
        body: [
          "The splits are speaker-disjoint. Emotion datasets are small and speaker-heavy, so a random split lets a model score well by learning to recognise the eight actors rather than the eight emotions. Holding speakers out entirely is what makes the number above mean anything, and it is why the baseline looks modest compared to figures reported on random splits.",
        ],
      },
      {
        heading: "Where it is going",
        body: [
          "The target output combines categorical emotion probabilities, continuous valence/arousal/dominance estimates, and calibrated uncertainty — the last of which is the part most systems skip and the part that determines whether the prediction is safe to act on.",
        ],
      },
    ],
  },
  {
    slug: "rag-pipeline-research",
    name: "rag-pipeline-research",
    tagline: "Production RAG over arXiv papers, on a public benchmark",
    year: "2026",
    kind: "ai",
    featured: false,
    repo: `${GITHUB}/rag-pipeline-research`,
    stack: ["Pydantic", "FAISS", "BGE / E5", "Streamlit", "OpenRouter"],
    metrics: [
      { label: "Benchmark", value: "open_ragbench" },
      { label: "Judge dims", value: "4" },
    ],
    summary:
      "A research assistant over arXiv papers built on vectara/open_ragbench, structured as swappable typed components rather than a single script.",
    sections: [
      {
        heading: "Architecture",
        body: [
          "Everything is written against an interface — BaseChunker, BaseEmbedder, BaseVectorStore, BaseRetriever, BaseReranker, BaseLLM — with Pydantic models for the data that moves between them. Sentence, sliding-window and semantic chunkers, dense/BM25/hybrid retrievers, a FAISS store and an LLM reranker all slot into the same pipeline.",
          "That structure is what let the retrieval components be vendored straight out of the sibling evaluation project: the benchmark and the production system share implementations rather than drifting apart.",
        ],
      },
      {
        heading: "Shipped surface",
        list: [
          "Three CLIs — ingest (build and persist an index), serve (interactive QA), evaluate (experiment grid to JSON)",
          "Citation extraction and index persistence",
          "IR metrics: recall, precision, MRR, nDCG",
          "LLM-as-Judge scoring answers 1–5 on relevance, accuracy, completeness and citation quality",
          "A Streamlit QA interface over the whole thing",
        ],
      },
    ],
  },
  {
    slug: "llm-resume-coach",
    name: "llm-resume-coach",
    tagline: "An LLM judge kept honest by a deterministic labeler",
    year: "2026",
    kind: "ai",
    featured: false,
    repo: `${GITHUB}/llm-resume-coach`,
    stack: ["Groq", "LLaMA", "instructor", "Pydantic", "Streamlit", "FastAPI"],
    metrics: [
      { label: "Judge dims", value: "6" },
      { label: "Stages", value: "5" },
    ],
    summary:
      "An end-to-end pipeline that generates synthetic resume–job pairs, gates them on rule-based quality checks, and scores fit with an LLM judge across six dimensions.",
    sections: [
      {
        heading: "The loop",
        body: [
          "Generate → quality gate → label → LLM judge → analysis → iterate. Every stage has both a CLI and a tab in the Streamlit app, so the pipeline can be driven either by a script or by hand.",
        ],
      },
      {
        heading: "Why keep a rule labeler",
        body: [
          "The pipeline maintains a deterministic rule-based labeler alongside the LLM judge, as human-verifiable ground truth. That is the part I would defend hardest: without a labeler you can actually read, an LLM judge is an unfalsifiable number. With one, judge–labeler disagreement becomes a measurable signal that tells you when the prompt has drifted.",
        ],
      },
    ],
  },
  {
    slug: "synthetic-data-pipeline",
    name: "synthetic-data-pipeline",
    tagline: "Human-in-the-loop generation and judge calibration",
    year: "2026",
    kind: "ai",
    featured: false,
    repo: `${GITHUB}/synthetic-data-pipeline`,
    stack: ["Groq", "instructor", "sentence-transformers", "Streamlit"],
    metrics: [{ label: "Stages", value: "6" }],
    summary:
      "Synthetic Q&A trace generation for a chatbot assistant, with a human review stage that calibrates the LLM judge and turns prompt iteration into a quantitative loop.",
    sections: [
      {
        heading: "The loop",
        body: [
          "Generate → quality gate → human review → LLM judge → analysis → iterate. The human review stage sits deliberately upstream of the judge: labels collected there are what the judge is calibrated against, so agreement between the two becomes the metric that drives the next prompt revision.",
          "As with the resume pipeline, every step is available both as a CLI and as a Streamlit tab.",
        ],
      },
    ],
  },
  {
    slug: "sequencer",
    name: "Sequencer",
    tagline: "A TR-909 step sequencer with the audio engine kept out of React",
    year: "2026",
    kind: "craft",
    featured: false,
    demo: "#/sequencer",
    repo: "https://github.com/metzgerdev/nam-dao",
    stack: ["Web Audio API", "React 19", "TypeScript"],
    metrics: [
      { label: "Lookahead", value: "25ms" },
      { label: "Schedule ahead", value: "100ms" },
      { label: "Steps", value: "16" },
    ],
    summary:
      "A hardware-inspired step sequencer where timing, scheduling and sample triggering run entirely through the Web Audio API — deliberately decoupled from the React render cycle.",
    sections: [
      {
        heading: "The architecture decision",
        body: [
          "Audio scheduling and UI rendering have incompatible timing requirements. React's render cycle is best-effort; a drum machine is not. So the engine runs on refs and a lookahead scheduler against the Web Audio clock, and React is left owning only pattern state and the interface.",
          "The scheduler wakes every 25ms and queues any step falling inside a 100ms horizon, which means playback is unaffected by a slow render, a state update or a dropped frame. The visual playhead reads the engine, never the other way round.",
        ],
      },
    ],
  },
  {
    slug: "music-player",
    name: "Music Player",
    tagline: "A player with a K-weighted VU meter and a mock GraphQL layer",
    year: "2026",
    kind: "craft",
    featured: false,
    demo: "#/music-player",
    repo: "https://github.com/metzgerdev/nam-dao",
    stack: ["GraphQL", "TanStack Query", "Web Audio API", "React 19"],
    metrics: [
      { label: "Data layer", value: "mock GraphQL" },
      { label: "Metering", value: "K-weighted" },
    ],
    summary:
      "A player for my own music, built against a mock GraphQL layer instead of static imports so the data flow resembles something production-shaped.",
    sections: [
      {
        heading: "Data layer",
        body: [
          "Rather than wiring the UI to a static array, requests go to /graphql and are resolved client-side against a real local schema. TanStack Query handles caching, loading and async state. The route is lazy-loaded, and the audio element preloads metadata so the interface becomes responsive before media playback is ready.",
        ],
      },
      {
        heading: "The VU meter",
        body: [
          "The meter computes RMS energy and runs the signal through a K-weighted IIR filter chain rather than reading peaks. K-weighting is the curve used in broadcast loudness standards because it tracks human loudness perception — a peak meter tells you what the samples are doing, a K-weighted meter tells you what the listener hears.",
        ],
      },
    ],
  },
];

export const featuredProjects = projects.filter((p) => p.featured);
export const aiProjects = projects.filter((p) => p.kind === "ai");
export const craftProjects = projects.filter((p) => p.kind === "craft");

export function projectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
