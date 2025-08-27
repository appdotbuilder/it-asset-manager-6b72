import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { UserManagement } from './UserManagement';
import { useAuth } from './AuthContext';
import type { 
  Category, 
  CreateCategoryInput, 
  UpdateCategoryInput,
  Supplier,
  CreateSupplierInput,
  UpdateSupplierInput 
} from '../../../server/src/schema';

export function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // Category form state
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryFormData, setCategoryFormData] = useState<CreateCategoryInput>({
    name: '',
    description: null
  });

  // Supplier form state
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierFormData, setSupplierFormData] = useState<CreateSupplierInput>({
    name: '',
    contact_person: null,
    phone_number: null,
    address: null
  });

  const loadData = useCallback(async () => {
    try {
      const [categoriesResult, suppliersResult] = await Promise.all([
        trpc.categories.getAll.query(),
        trpc.suppliers.getAll.query()
      ]);

      setCategories(categoriesResult);
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

  // Category handlers
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingCategory) {
        const updateData: UpdateCategoryInput = {
          id: editingCategory.id,
          ...categoryFormData
        };
        await trpc.categories.update.mutate(updateData);
      } else {
        await trpc.categories.create.mutate(categoryFormData);
      }
      
      await loadData();
      resetCategoryForm();
    } catch (error) {
      console.error('Failed to save category:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryEdit = (category: Category) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      description: category.description
    });
    setShowCategoryForm(true);
  };

  const handleCategoryDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await trpc.categories.delete.mutate({ id });
      await loadData();
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Cannot delete category - it may be in use by inventory items.');
    }
  };

  const resetCategoryForm = () => {
    setCategoryFormData({
      name: '',
      description: null
    });
    setEditingCategory(null);
    setShowCategoryForm(false);
  };

  // Supplier handlers
  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingSupplier) {
        const updateData: UpdateSupplierInput = {
          id: editingSupplier.id,
          ...supplierFormData
        };
        await trpc.suppliers.update.mutate(updateData);
      } else {
        await trpc.suppliers.create.mutate(supplierFormData);
      }
      
      await loadData();
      resetSupplierForm();
    } catch (error) {
      console.error('Failed to save supplier:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSupplierEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setSupplierFormData({
      name: supplier.name,
      contact_person: supplier.contact_person,
      phone_number: supplier.phone_number,
      address: supplier.address
    });
    setShowSupplierForm(true);
  };

  const handleSupplierDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;
    
    try {
      await trpc.suppliers.delete.mutate({ id });
      await loadData();
    } catch (error) {
      console.error('Failed to delete supplier:', error);
      alert('Cannot delete supplier - it may be in use by purchase records.');
    }
  };

  const resetSupplierForm = () => {
    setSupplierFormData({
      name: '',
      contact_person: null,
      phone_number: null,
      address: null
    });
    setEditingSupplier(null);
    setShowSupplierForm(false);
  };

  const renderCategoriesTab = () => (
    <div className="win98-tab-content">
      <div className="form-row">
        <button 
          className="win98-button-primary" 
          onClick={() => setShowCategoryForm(true)}
        >
          Add New Category
        </button>
        <button 
          className="win98-button" 
          onClick={() => loadData()}
        >
          Refresh
        </button>
      </div>

      {showCategoryForm && (
        <div className="win98-group">
          <div className="win98-group-title">
            {editingCategory ? 'Edit Category' : 'Add New Category'}
          </div>
          
          <form onSubmit={handleCategorySubmit}>
            <div className="form-grid">
              <label>Category Name:</label>
              <input
                type="text"
                className="win98-input"
                value={categoryFormData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCategoryFormData((prev: CreateCategoryInput) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Electronics, Furniture, Software"
                required
              />

              <label>Description:</label>
              <textarea
                className="win98-textarea"
                value={categoryFormData.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setCategoryFormData((prev: CreateCategoryInput) => ({ ...prev, description: e.target.value || null }))
                }
                rows={3}
                placeholder="Optional description of this category"
              />
            </div>

            <div className="form-row">
              <button type="submit" className="win98-button-primary" disabled={loading}>
                {loading ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
              </button>
              <button type="button" className="win98-button" onClick={resetCategoryForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <table className="win98-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category: Category) => (
            <tr key={category.id}>
              <td><strong>{category.name}</strong></td>
              <td>
                {category.description ? (
                  <span title={category.description}>
                    {category.description.length > 60 ? category.description.substring(0, 60) + '...' : category.description}
                  </span>
                ) : (
                  <em style={{ color: '#999' }}>No description</em>
                )}
              </td>
              <td>{category.created_at.toLocaleDateString()}</td>
              <td>
                <button 
                  className="win98-button" 
                  onClick={() => handleCategoryEdit(category)}
                  style={{ marginRight: '4px' }}
                >
                  Edit
                </button>
                <button 
                  className="win98-button" 
                  onClick={() => handleCategoryDelete(category.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {categories.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#808080' }}>
          No categories found. Click "Add New Category" to get started.
        </div>
      )}
    </div>
  );

  const renderSuppliersTab = () => (
    <div className="win98-tab-content">
      <div className="form-row">
        <button 
          className="win98-button-primary" 
          onClick={() => setShowSupplierForm(true)}
        >
          Add New Supplier
        </button>
        <button 
          className="win98-button" 
          onClick={() => loadData()}
        >
          Refresh
        </button>
      </div>

      {showSupplierForm && (
        <div className="win98-group">
          <div className="win98-group-title">
            {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
          </div>
          
          <form onSubmit={handleSupplierSubmit}>
            <div className="form-grid">
              <label>Supplier Name:</label>
              <input
                type="text"
                className="win98-input"
                value={supplierFormData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSupplierFormData((prev: CreateSupplierInput) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Tech Solutions Inc., Office Depot"
                required
              />

              <label>Contact Person:</label>
              <input
                type="text"
                className="win98-input"
                value={supplierFormData.contact_person || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSupplierFormData((prev: CreateSupplierInput) => ({ ...prev, contact_person: e.target.value || null }))
                }
                placeholder="Name of primary contact"
              />

              <label>Phone Number:</label>
              <input
                type="tel"
                className="win98-input"
                value={supplierFormData.phone_number || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSupplierFormData((prev: CreateSupplierInput) => ({ ...prev, phone_number: e.target.value || null }))
                }
                placeholder="e.g., +1-555-123-4567"
              />

              <label>Address:</label>
              <textarea
                className="win98-textarea"
                value={supplierFormData.address || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setSupplierFormData((prev: CreateSupplierInput) => ({ ...prev, address: e.target.value || null }))
                }
                rows={3}
                placeholder="Complete address of the supplier"
              />
            </div>

            <div className="form-row">
              <button type="submit" className="win98-button-primary" disabled={loading}>
                {loading ? 'Saving...' : editingSupplier ? 'Update' : 'Create'}
              </button>
              <button type="button" className="win98-button" onClick={resetSupplierForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <table className="win98-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Contact Person</th>
            <th>Phone</th>
            <th>Address</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((supplier: Supplier) => (
            <tr key={supplier.id}>
              <td><strong>{supplier.name}</strong></td>
              <td>{supplier.contact_person || <em style={{ color: '#999' }}>Not specified</em>}</td>
              <td>{supplier.phone_number || <em style={{ color: '#999' }}>Not specified</em>}</td>
              <td>
                {supplier.address ? (
                  <span title={supplier.address}>
                    {supplier.address.length > 40 ? supplier.address.substring(0, 40) + '...' : supplier.address}
                  </span>
                ) : (
                  <em style={{ color: '#999' }}>Not specified</em>
                )}
              </td>
              <td>{supplier.created_at.toLocaleDateString()}</td>
              <td>
                <button 
                  className="win98-button" 
                  onClick={() => handleSupplierEdit(supplier)}
                  style={{ marginRight: '4px' }}
                >
                  Edit
                </button>
                <button 
                  className="win98-button" 
                  onClick={() => handleSupplierDelete(supplier.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {suppliers.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#808080' }}>
          No suppliers found. Click "Add New Supplier" to get started.
        </div>
      )}
    </div>
  );

  const renderUserManagementTab = () => (
    <div className="win98-tab-content">
      <UserManagement />
    </div>
  );

  if (loading && categories.length === 0 && suppliers.length === 0) {
    return (
      <div className="win98-group">
        <div className="win98-group-title">⚙️ Settings</div>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          Loading settings data...
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="win98-group">
        <div className="win98-group-title">⚙️ Settings</div>
        
        <div className="win98-tabs">
          <div className="win98-tab-list">
            <button 
              className={`win98-tab ${activeTab === 'categories' ? 'active' : ''}`}
              onClick={() => setActiveTab('categories')}
            >
              📂 Categories
            </button>
            <button 
              className={`win98-tab ${activeTab === 'suppliers' ? 'active' : ''}`}
              onClick={() => setActiveTab('suppliers')}
            >
              🏢 Suppliers
            </button>
            {user?.role === 'admin' && (
              <button 
                className={`win98-tab ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                👥 Manajemen Pengguna
              </button>
            )}
          </div>

          {activeTab === 'categories' && renderCategoriesTab()}
          {activeTab === 'suppliers' && renderSuppliersTab()}
          {activeTab === 'users' && user?.role === 'admin' && renderUserManagementTab()}
        </div>
      </div>
    </div>
  );
}