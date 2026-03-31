const CARS = [
  {
    image: "./car-01.png",
    alt: "Silver BMW convertible",
    title: "2011 BMW M3",
    copy: "Currently at 127,000 miles and going strong with an epic v8 soundtrack from the legendary s65 motor. 8200 RPM redline",
    position: "center 76%",
  },
  {
    image: "./car-02.png",
    alt: "Matte black Porsche coupe",
    title: "2001 Porsche 911 Turbo",
    copy: 'Currently at 108,000 miles, and packs a wallop from the "Metzger" turbo flat 6 derived from the 1998 Le Man wining GT1 race car. 194 MPH top speed',
    position: "center 80%",
  },
];

function TooFastTooFurious() {
  return (
    <main className="garage">
      <section className="garage-shell">
        <div className="garage-intro">
          <p className="home-kicker">Too Fast Too Furious</p>
          <p className="garage-summary">
            Two machines that keep me inspired. 🇩🇪 I love how car design blends
            proportion, emotion, and engineering into something you can feel
            even at rest. Cars are perhaps the ultimate expression of human
            centric design. Wrenching on cars requires discipline and systems
            thinking.
          </p>
        </div>

        <section className="garage-grid" aria-label="Car gallery">
          {CARS.map((car) => (
            <article className="garage-kicker" key={car.title}>
              <div className="garage-image-frame">
                <img
                  alt={car.alt}
                  className="garage-image"
                  src={car.image}
                  style={{ objectPosition: car.position }}
                />
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
