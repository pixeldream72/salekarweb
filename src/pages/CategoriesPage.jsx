import { useEffect, useState } from 'react';
import { fetchCategories } from '../services/supabaseService.js';

function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [source, setSource] = useState('loading');

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      const result = await fetchCategories();

      if (!isMounted) {
        return;
      }

      setCategories(result.data);
      setSource(result.source);
    };

    void loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="page-card">
      <p className="eyebrow">Categories</p>
      <h1>Categories</h1>
      <p>{source === 'supabase' ? 'Live Supabase data' : 'Demo fallback data'}.</p>

      <ul className="data-list">
        {categories.map((category) => (
          <li key={category.id}>
            <strong>{category.name}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default CategoriesPage;
