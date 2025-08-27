import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { useLanguage } from './LanguageContext';
import type { 
  InventoryItem, 
  CreateInventoryItemInput, 
  UpdateInventoryItemInput,
  Category,
  Location,
  BatchImportInput 
} from '../../../server/src/schema';

interface InventoryWithDetails extends InventoryItem {
  category_name?: string;
  location_name?: string;
}

export function Inventory() {
  const { t } = useLanguage();
  const [items, setItems] = useState<InventoryWithDetails[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryWithDetails | null>(null);
  const [showBatchImport, setShowBatchImport] = useState(false);

  const [formData, setFormData] = useState<CreateInventoryItemInput>({
    item_code: '',
    name: '',
    description: null,
    category_id: 0,
    location_id: 0,
    condition: 'good',
    quantity: 0,
    purchase_price: 0,
    purchase_date: new Date()
  });

  const [batchData, setBatchData] = useState<string>('');

  const loadData = useCallback(async () => {
    try {
      const [itemsResult, categoriesResult, locationsResult] = await Promise.all([
        trpc.inventory.getAll.query(),
        trpc.categories.getAll.query(),
        trpc.locations.getAll.query()
      ]);

      // Enhance items with category and location names
      const itemsWithDetails = itemsResult.map((item: InventoryItem) => {
        const category = categoriesResult.find((cat: Category) => cat.id === item.category_id);
        const location = locationsResult.find((loc: Location) => loc.id === item.location_id);
        
        return {
          ...item,
          category_name: category?.name,
          location_name: location?.name
        };
      });

      setItems(itemsWithDetails);
      setCategories(categoriesResult);
      setLocations(locationsResult);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingItem) {
        const updateData: UpdateInventoryItemInput = {
          id: editingItem.id,
          ...formData
        };
        await trpc.inventory.update.mutate(updateData);
      } else {
        await trpc.inventory.create.mutate(formData);
      }
      
      await loadData();
      resetForm();
    } catch (error) {
      console.error('Failed to save item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: InventoryWithDetails) => {
    setEditingItem(item);
    setFormData({
      item_code: item.item_code,
      name: item.name,
      description: item.description,
      category_id: item.category_id,
      location_id: item.location_id,
      condition: item.condition,
      quantity: item.quantity,
      purchase_price: item.purchase_price,
      purchase_date: item.purchase_date
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('inventory.confirmDelete'))) return;
    
    try {
      await trpc.inventory.delete.mutate({ id });
      await loadData();
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      item_code: '',
      name: '',
      description: null,
      category_id: 0,
      location_id: 0,
      condition: 'good',
      quantity: 0,
      purchase_price: 0,
      purchase_date: new Date()
    });
    setEditingItem(null);
    setShowForm(false);
  };

  const handleBatchImport = async () => {
    try {
      const lines = batchData.trim().split('\n');
      const items = lines.map((line: string) => {
        const [item_code, name, description, category_name, location_name, condition, quantity, purchase_price, purchase_date] = line.split('\t');
        
        return {
          item_code: item_code?.trim() || '',
          name: name?.trim() || '',
          description: description?.trim() || null,
          category_name: category_name?.trim() || '',
          location_name: location_name?.trim() || '',
          condition: condition?.trim() as any || 'good',
          quantity: parseInt(quantity?.trim() || '0'),
          purchase_price: parseFloat(purchase_price?.trim() || '0'),
          purchase_date: new Date(purchase_date?.trim() || new Date())
        };
      });

      const batchInput: BatchImportInput = { items };
      await trpc.inventory.batchImport.mutate(batchInput);
      await loadData();
      setBatchData('');
      setShowBatchImport(false);
    } catch (error) {
      console.error('Failed to batch import items:', error);
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="win98-group">
        <div className="win98-group-title">📦 {t('inventory.title')}</div>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          {t('inventory.loading')}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="win98-group">
        <div className="win98-group-title">📦 {t('inventory.title')}</div>
        
        <div className="form-row">
          <button 
            className="win98-button-primary" 
            onClick={() => setShowForm(true)}
          >
            {t('inventory.addItem')}
          </button>
          <button 
            className="win98-button" 
            onClick={() => setShowBatchImport(true)}
          >
            {t('inventory.batchImport')}
          </button>
          <button 
            className="win98-button" 
            onClick={() => loadData()}
          >
            {t('common.refresh')}
          </button>
        </div>

        {showForm && (
          <div className="win98-group">
            <div className="win98-group-title">
              {editingItem ? t('inventory.editItem') : t('inventory.addItem')}
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <label>{t('inventory.itemCode')}:</label>
                <input
                  type="text"
                  className="win98-input"
                  value={formData.item_code}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateInventoryItemInput) => ({ ...prev, item_code: e.target.value }))
                  }
                  required
                />

                <label>{t('inventory.itemName')}:</label>
                <input
                  type="text"
                  className="win98-input"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateInventoryItemInput) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />

                <label>{t('inventory.description')}:</label>
                <textarea
                  className="win98-textarea"
                  value={formData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateInventoryItemInput) => ({ ...prev, description: e.target.value || null }))
                  }
                  rows={3}
                />

                <label>{t('inventory.category')}:</label>
                <select
                  className="win98-select"
                  value={formData.category_id}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setFormData((prev: CreateInventoryItemInput) => ({ ...prev, category_id: parseInt(e.target.value) }))
                  }
                  required
                >
                  <option value={0}>{t('common.select')}</option>
                  {categories.map((category: Category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                <label>{t('inventory.location')}:</label>
                <select
                  className="win98-select"
                  value={formData.location_id}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setFormData((prev: CreateInventoryItemInput) => ({ ...prev, location_id: parseInt(e.target.value) }))
                  }
                  required
                >
                  <option value={0}>{t('common.select')}</option>
                  {locations.map((location: Location) => (
                    <option key={location.id} value={location.id}>
                      {location.name} ({location.branch_code})
                    </option>
                  ))}
                </select>

                <label>{t('inventory.condition')}:</label>
                <select
                  className="win98-select"
                  value={formData.condition}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setFormData((prev: CreateInventoryItemInput) => ({ ...prev, condition: e.target.value as any }))
                  }
                >
                  <option value="excellent">{t('inventory.conditions.excellent')}</option>
                  <option value="good">{t('inventory.conditions.good')}</option>
                  <option value="fair">{t('inventory.conditions.fair')}</option>
                  <option value="poor">{t('inventory.conditions.poor')}</option>
                  <option value="damaged">{t('inventory.conditions.damaged')}</option>
                </select>

                <label>{t('inventory.quantity')}:</label>
                <input
                  type="number"
                  className="win98-input"
                  value={formData.quantity}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateInventoryItemInput) => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))
                  }
                  min="0"
                  required
                />

                <label>{t('inventory.purchasePrice')}:</label>
                <input
                  type="number"
                  className="win98-input"
                  value={formData.purchase_price}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateInventoryItemInput) => ({ ...prev, purchase_price: parseFloat(e.target.value) || 0 }))
                  }
                  step="0.01"
                  min="0"
                  required
                />

                <label>{t('inventory.purchaseDate')}:</label>
                <input
                  type="date"
                  className="win98-input"
                  value={formData.purchase_date.toISOString().split('T')[0]}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateInventoryItemInput) => ({ ...prev, purchase_date: new Date(e.target.value) }))
                  }
                  required
                />
              </div>

              <div className="form-row">
                <button type="submit" className="win98-button-primary" disabled={loading}>
                  {loading ? `${t('inventory.save')}...` : editingItem ? t('inventory.save') : t('inventory.save')}
                </button>
                <button type="button" className="win98-button" onClick={resetForm}>
                  {t('inventory.cancel')}
                </button>
              </div>
            </form>
          </div>
        )}

        {showBatchImport && (
          <div className="win98-group">
            <div className="win98-group-title">{t('inventory.batchImport')}</div>
            
            <p style={{ marginBottom: '8px' }}>
              Paste tab-separated data with columns: Item Code, Name, Description, Category Name, Location Name, Condition, Quantity, Purchase Price, Purchase Date
            </p>
            
            <textarea
              className="win98-textarea"
              value={batchData}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBatchData(e.target.value)}
              rows={10}
              placeholder="IT001	Laptop Dell	High-performance laptop	Electronics	Main Office	excellent	1	1500.00	2023-01-15"
            />

            <div className="form-row">
              <button className="win98-button-primary" onClick={handleBatchImport}>
                {t('common.import')}
              </button>
              <button className="win98-button" onClick={() => setShowBatchImport(false)}>
                {t('inventory.cancel')}
              </button>
            </div>
          </div>
        )}

        <table className="win98-table">
          <thead>
            <tr>
              <th>{t('inventory.itemCode')}</th>
              <th>{t('inventory.itemName')}</th>
              <th>{t('inventory.category')}</th>
              <th>{t('inventory.location')}</th>
              <th>{t('inventory.condition')}</th>
              <th>{t('inventory.quantity')}</th>
              <th>{t('inventory.purchasePrice')}</th>
              <th>{t('inventory.purchaseDate')}</th>
              <th>{t('inventory.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: InventoryWithDetails) => (
              <tr key={item.id}>
                <td>{item.item_code}</td>
                <td>{item.name}</td>
                <td>{item.category_name}</td>
                <td>{item.location_name}</td>
                <td>
                  <span className={`status-${item.condition}`}>
                    {t(`inventory.conditions.${item.condition}` as any) || item.condition.charAt(0).toUpperCase() + item.condition.slice(1)}
                  </span>
                </td>
                <td>{item.quantity}</td>
                <td>${item.purchase_price.toFixed(2)}</td>
                <td>{item.purchase_date.toLocaleDateString()}</td>
                <td>
                  <button 
                    className="win98-button" 
                    onClick={() => handleEdit(item)}
                    style={{ marginRight: '4px' }}
                  >
                    {t('inventory.edit')}
                  </button>
                  <button 
                    className="win98-button" 
                    onClick={() => handleDelete(item.id)}
                  >
                    {t('inventory.delete')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#808080' }}>
            {t('inventory.noItems')}
          </div>
        )}
      </div>
    </div>
  );
}