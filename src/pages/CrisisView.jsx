export default function CrisisView({ crisisResources }) {
  return (
    <section className="page">
      <p className="eyebrow">Safety first</p>
      <h2>You deserve immediate support.</h2>

      <div className="danger">
        <h3>If you might hurt yourself or someone else</h3>
        <p>
          Call emergency services now or contact a crisis line in your country.
          Quiet Circle is not emergency care.
        </p>
      </div>

      <div className="grid two">
        {crisisResources.map((resource, index) => (
          <div key={index} className="card crisisCard">
            <h3>{resource.name}</h3>
            <p>{resource.detail}</p>
            {resource.phone && (
              <div className="crisisPhone">{resource.phone}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
