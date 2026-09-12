function SectionHeader({ eyebrow, title, description }) {
  return (
    <div className="section-heading">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2>{title}</h2>
      {description ? <p className="page-description">{description}</p> : null}
    </div>
  );
}

export default SectionHeader;
