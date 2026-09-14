import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient' // adjust path if your file is elsewhere, e.g. './lib/supabaseClient'

const TEST_SHOP_OWNER_ID = '1beedea8-7e9b-4878-bf6f-0e2bf1ef34e4'

export default function TestProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('shop_owner_id', TEST_SHOP_OWNER_ID)

      if (error) setError(error.message)
      else setProducts(data)
      setLoading(false)
    }
    fetchProducts()
  }, [])

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error: {error}</p>

  return (
    <div style={{ padding: '20px' }}>
      <h2>Products for sktrader (test)</h2>
      <ul>
        {products.map((p) => (
          <li key={p.id}>{p.name} — Rs {p.price} ({p.qty} in stock)</li>
        ))}
      </ul>
    </div>
  )
}