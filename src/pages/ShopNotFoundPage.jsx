function ShopNotFoundPage({ shopOwnerId }) {
  return (
    <section className="page-card">
      <p className="eyebrow">Shop not found</p>
      <h1>Shop not found</h1>
      <p>
        {shopOwnerId
          ? `No shop matches the provided shop owner ID: ${shopOwnerId}.`
          : 'The requested shop could not be found or the URL is invalid.'}
      </p>
    </section>
  );
}

export default ShopNotFoundPage;
