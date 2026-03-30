const CARS = [
  {
    image: "./car-01.png",
    alt: "Silver BMW convertible",
    title: "Machine 01",
    copy: "2011 BMW M3, currently at 127,000 miles and going strong.",
  },
  {
    image: "./car-02.png",
    alt: "Matte black Porsche coupe",
    title: "Machine 02",
    copy: "A darker silhouette focused on proportion, surface, and presence.",
  },
];

function TooFastTooFurious() {
  return (
    <main className="garage">
      <section className="garage-shell">
        <div className="garage-intro">
          <p className="garage-kicker">Too Fast Too Furious</p>
          <h1>My Cars</h1>
          <p className="garage-summary">
            Two machines that keep me inspired. I love how car design blends
            proportion, emotion, and engineering into something you can feel at
            a glance.
          </p>
        </div>

        <section className="garage-grid" aria-label="Car gallery">
          {CARS.map((car) => (
            <article className="garage-card" key={car.title}>
              <div className="garage-image-frame">
                <img alt={car.alt} className="garage-image" src={car.image} />
              </div>
              <div className="garage-copy">
                <p className="garage-card-label">{car.title}</p>
                <p className="garage-card-text">{car.copy}</p>
              </div>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}

export default TooFastTooFurious;
