import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import type { 
  Purchase, 
  CreatePurchaseInput, 
  UpdatePurchaseInput,
  InventoryItem,
  Supplier
} from '../../../server/src/schema';

interface PurchaseWithDetails extends Purchase {
  item_name?: string;
  item_code?: string;
  supplier_name?: string;
}

export function Purchases() {
  const [purchases, setPurchases] = useState<PurchaseWithDetails[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<PurchaseWithDetails | null>(null);

  const [formData, setFormData] = useState<CreatePurchaseInput>({
    item_id: 0,
    supplier_id: 0,
    quantity: 0,
    unit_price: 0,
    purchase_date: new Date(),
    notes: null
  });

  const loadData = useCallback(async () => {
    try {
      const [purchasesResult, itemsResult, suppliersResult] = await Promise.all([
        trpc.purchases.getAll.query(),
        trpc.inventory.getAll.query(),
        trpc.suppliers.getAll.query()
      ]);

      // Enhance purchases with item and supplier details
      const purchasesWithDetails = purchasesResult.map((purchase: Purchase) => {
        const item = itemsResult.find((item: InventoryItem) => item.id === purchase.item_id);
        const supplier = suppliersResult.find((supplier: Supplier) => supplier.id === purchase.supplier_id);
        
        return {
          ...purchase,
          item_name: item?.name,
          item_code: item?.item_code,
          supplier_name: supplier?.name
        };
      });

      setPurchases(purchasesWithDetails);
      setItems(itemsResult);
      setSuppliers(suppliersResult);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate total price when quantity or unit price changes
  useEffect(() => {
    // This is handled in the component display, no need for separate state
  }, [formData.quantity, formData.unit_price]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingPurchase) {
        const updateData: UpdatePurchaseInput = {
          id: editingPurchase.id,
          ...formData
        };
        await trpc.purchases.update.mutate(updateData);
      } else {
        await trpc.purchases.create.mutate(formData);
      }
      
      await loadData();
      resetForm();
    } catch (error) {
      console.error('Failed to save purchase:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (purchase: PurchaseWithDetails) => {
    setEditingPurchase(purchase);
    setFormData({
      item_id: purchase.item_id,
      supplier_id: purchase.supplier_id,
      quantity: purchase.quantity,
      unit_price: purchase.unit_price,
      purchase_date: purchase.purchase_date,
      notes: purchase.notes
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this purchase record?')) return;
    
    try {
      await trpc.purchases.delete.mutate({ id });
      await loadData();
    } catch (error) {
      console.error('Failed to delete purchase:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      item_id: 0,
      supplier_id: 0,
      quantity: 0,
      unit_price: 0,
      purchase_date: new Date(),
      notes: null
    });
    setEditingPurchase(null);
    setShowForm(false);
  };

  const getTotalPrice = () => {
    return (formData.quantity * formData.unit_price).toFixed(2);
  };

  if (loading && purchases.length === 0) {
    return (
      <div className="win98-group">
        <div className="win98-group-title">🛒 Purchase Management</div>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          Loading purchase data...
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="win98-group">
        <div className="win98-group-title">🛒 Purchase Management</div>
        
        <div className="form-row">
          <button 
            className="win98-button-primary" 
            onClick={() => setShowForm(true)}
          >
            Record New Purchase
          </button>
          <button 
            className="win98-button" 
            onClick={() => loadData()}
          >
            Refresh
          </button>
        </div>

        {showForm && (
          <div className="win98-group">
            <div className="win98-group-title">
              {editingPurchase ? 'Edit Purchase' : 'Record New Purchase'}
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <label>Item:</label>
                <select
                  className="win98-select"
                  value={formData.item_id}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setFormData((prev: CreatePurchaseInput) => ({ ...prev, item_id: parseInt(e.target.value) }))
                  }
                  required
                >
                  <option value={0}>Select Item</option>
                  {items.map((item: InventoryItem) => (
                    <option key={item.id} value={item.id}>
                      {item.item_code} - {item.name}
                    </option>
                  ))}
                </select>

                <label>Supplier:</label>
                <select
                  className="win98-select"
                  value={formData.supplier_id}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setFormData((prev: CreatePurchaseInput) => ({ ...prev, supplier_id: parseInt(e.target.value) }))
                  }
                  required
                >
                  <option value={0}>Select Supplier</option>
                  {suppliers.map((supplier: Supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>

                <label>Quantity:</label>
                <input
                  type="number"
                  className="win98-input"
                  value={formData.quantity}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreatePurchaseInput) => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))
                  }
                  min="1"
                  required
                />

                <label>Unit Price:</label>
                <input
                  type="number"
                  className="win98-input"
                  value={formData.unit_price}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreatePurchaseInput) => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))
                  }
                  step="0.01"
                  min="0"
                  required
                />

                <label>Total Price:</label>
                <input
                  type="text"
                  className="win98-input"
                  value={`$${getTotalPrice()}`}
                  readOnly
                  style={{ background: '#f0f0f0' }}
                />

                <label>Purchase Date:</label>
                <input
                  type="date"
                  className="win98-input"
                  value={formData.purchase_date.toISOString().split('T')[0]}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreatePurchaseInput) => ({ ...prev, purchase_date: new Date(e.target.value) }))
                  }
                  required
                />

                <label>Notes:</label>
                <textarea
                  className="win98-textarea"
                  value={formData.notes || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreatePurchaseInput) => ({ ...prev, notes: e.target.value || null }))
                  }
                  rows={3}
                  placeholder="Optional notes about this purchase..."
                />
              </div>

              <div className="form-row">
                <button type="submit" className="win98-button-primary" disabled={loading}>
                  {loading ? 'Saving...' : editingPurchase ? 'Update' : 'Record Purchase'}
                </button>
                <button type="button" className="win98-button" onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <table className="win98-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Supplier</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total Price</th>
              <th>Purchase Date</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((purchase: PurchaseWithDetails) => (
              <tr key={purchase.id}>
                <td>
                  <div>{purchase.item_name}</div>
                  <small style={{ color: '#666' }}>{purchase.item_code}</small>
                </td>
                <td>{purchase.supplier_name}</td>
                <td>{purchase.quantity}</td>
                <td>${purchase.unit_price.toFixed(2)}</td>
                <td>${purchase.total_price.toFixed(2)}</td>
                <td>{purchase.purchase_date.toLocaleDateString()}</td>
                <td>
                  {purchase.notes && (
                    <span title={purchase.notes}>
                      {purchase.notes.length > 30 ? purchase.notes.substring(0, 30) + '...' : purchase.notes}
                    </span>
                  )}
                </td>
                <td>
                  <button 
                    className="win98-button" 
                    onClick={() => handleEdit(purchase)}
                    style={{ marginRight: '4px' }}
                  >
                    Edit
                  </button>
                  <button 
                    className="win98-button" 
                    onClick={() => handleDelete(purchase.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {purchases.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#808080' }}>
            No purchase records found. Click "Record New Purchase" to get started.
          </div>
        )}
      </div>
    </div>
  );
}