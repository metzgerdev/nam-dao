const portrait = new URL("./assets/nam-dao-profile.avif", import.meta.url).href;

const GITHUB_URL = "https://github.com/metzgerdev";
const LINKEDIN_URL = "https://www.linkedin.com/in/nam-dao";

const EXPERIENCE = [
  {
    org: "New Line AI accelerator",
    detail: "Current — building LLM systems, with a focus on audio",
  },
  {
    org: "NGINX (F5 Networks)",
    detail: "Front-end engineering",
  },
  {
    org: "Rescale",
    detail: "Front-end engineering",
  },
  {
    org: "Nintendo of America",
    detail: "Front-end engineering",
  },
];

function About() {
  return (
    <main aria-label="About">
      <section className="hero shell">
        <p className="hero-name">About</p>
        <h1 className="hero-statement">
          Signal processing, then software, now <em>models</em>.
        </h1>
      </section>

      <section className="section shell">
        <div className="about-grid">
          <div className="about-portrait-frame">
            <img
              alt="Portrait of Nam Dao"
              className="about-portrait"
              decoding="async"
              loading="lazy"
              src={portrait}
            />
          </div>

          <div className="prose">
            <p>
              I am an AI engineer in Los Angeles. I build LLM systems, and the
              thread running through most of my work is audio — generating it,
              understanding it, and evaluating whether a model actually got it
              right.
            </p>
            <p>
              I came to this from two directions. The first is an MS in
              electrical engineering from the University of Washington, which
              means the signal processing underneath a neural audio codec is
              legible to me rather than a black box. The second is eight years
              building front-end software at NGINX, Rescale and Nintendo of
              America, which taught me that the interface is usually where a
              system succeeds or fails in front of a real user.
            </p>
            <p>
              Those combine into a specific opinion about how ML work should be
              built. A model call is the easy part. What decides whether a
              system is any good is the data pipeline feeding it, the evaluation
              harness that tells you whether a change helped, and the place a
              human is allowed to intervene. My projects tend to spend most of
              their code on those three things — the corpus mining in midi_gpt,
              the deterministic labeler in the resume coach, the labeling app in
              electronic-lora.
            </p>
            <p>
              Outside of that I produce house music as Zynar, which is where the
              audio work keeps coming from. It is a useful discipline: with
              music you cannot talk yourself into believing a result is good.
              You either like what you hear or you do not.
            </p>
          </div>
        </div>
      </section>

      <section className="section shell" aria-labelledby="experience">
        <div className="section-head">
          <h2 className="section-title" id="experience">
            Experience
          </h2>
        </div>

        <dl className="fact-list">
          {EXPERIENCE.map((item) => (
            <div key={item.org}>
              <dt>{item.org}</dt>
              <dd>{item.detail}</dd>
            </div>
          ))}
          <div>
            <dt>Education</dt>
            <dd>
              MS Electrical Engineering, University of Washington · Hack Reactor
              software accelerator
            </dd>
          </div>
        </dl>
      </section>

      <section className="section shell" aria-labelledby="contact">
        <div className="section-head">
          <h2 className="section-title" id="contact">
            Get in touch
          </h2>
        </div>
        <p className="hero-summary">
          I am open to AI engineering roles. The fastest way to see how I work
          is the code — every project on this site links to its repository.
        </p>
        <div className="hero-links">
          <a
            className="link-button link-button--primary"
            href={LINKEDIN_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            LinkedIn
          </a>
          <a
            className="link-button"
            href={GITHUB_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            GitHub
          </a>
        </div>
      </section>
    </main>
  );
}

export default About;
