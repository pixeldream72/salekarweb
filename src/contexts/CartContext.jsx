import { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [cartMode, setCartMode] = useState('new'); // 'new' | 'editing' | 'reorder'
  const [editingQuotationId, setEditingQuotationId] = useState(null);

  const addToCart = (product, quantity = 1) => {
    setItems((current) => {
      const existingIndex = current.findIndex((item) => item.product.id === product.id);

      if (existingIndex >= 0) {
        const updated = [...current];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      }

      return [...current, { product, quantity }];
    });
  };

  const removeFromCart = (productId) => {
    setItems((current) => current.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    const nextQuantity = Number(quantity);

    if (!Number.isFinite(nextQuantity) || nextQuantity < 0) {
      return;
    }

    setItems((current) =>
      current.map((item) =>
        item.product.id === productId ? { ...item, quantity: nextQuantity } : item,
      ),
    );
  };

  const clearCart = () => {
    setItems([]);
    setCartMode('new');
    setEditingQuotationId(null);
  };

  const itemsFromQuotation = (quotationItems) =>
    quotationItems.map((item) => ({
      product: {
        id: item.product_id,
        name: item.name,
        item_code: item.item_code,
        category: item.category,
        color: item.color,
        unit: item.unit,
        price: item.rate,
      },
      quantity: item.qty,
    }));

  // For editing a PENDING quotation — will UPDATE the existing row
  const loadQuotationForEditing = (quotationId, quotationItems) => {
    setItems(itemsFromQuotation(quotationItems));
    setCartMode('editing');
    setEditingQuotationId(quotationId);
  };

  // For reordering a PAST quotation — will CREATE a brand new row
  const loadQuotationForReorder = (quotationItems) => {
    setItems(itemsFromQuotation(quotationItems));
    setCartMode('reorder');
    setEditingQuotationId(null);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.quantity * (item.product.price || 0), 0);

  const value = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalAmount,
    cartMode,
    editingQuotationId,
    loadQuotationForEditing,
    loadQuotationForReorder,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }

  return context;
}

export default CartContext;