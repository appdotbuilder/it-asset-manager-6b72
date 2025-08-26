import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import type { 
  Location, 
  CreateLocationInput, 
  UpdateLocationInput 
} from '../../../server/src/schema';

export function Locations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  const [formData, setFormData] = useState<CreateLocationInput>({
    name: '',
    branch_code: '',
    address: null
  });

  const loadData = useCallback(async () => {
    try {
      const result = await trpc.locations.getAll.query();
      setLocations(result);
    } catch (error) {
      console.error('Failed to load locations:', error);
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
      if (editingLocation) {
        const updateData: UpdateLocationInput = {
          id: editingLocation.id,
          ...formData
        };
        await trpc.locations.update.mutate(updateData);
      } else {
        await trpc.locations.create.mutate(formData);
      }
      
      await loadData();
      resetForm();
    } catch (error) {
      console.error('Failed to save location:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      branch_code: location.branch_code,
      address: location.address
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this location?')) return;
    
    try {
      await trpc.locations.delete.mutate({ id });
      await loadData();
    } catch (error) {
      console.error('Failed to delete location:', error);
      alert('Cannot delete location - it may be in use by inventory items.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      branch_code: '',
      address: null
    });
    setEditingLocation(null);
    setShowForm(false);
  };

  if (loading && locations.length === 0) {
    return (
      <div className="win98-group">
        <div className="win98-group-title">📍 Location Management</div>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          Loading location data...
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="win98-group">
        <div className="win98-group-title">📍 Location Management</div>
        
        <div className="form-row">
          <button 
            className="win98-button-primary" 
            onClick={() => setShowForm(true)}
          >
            Add New Location
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
              {editingLocation ? 'Edit Location' : 'Add New Location'}
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <label>Location Name:</label>
                <input
                  type="text"
                  className="win98-input"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateLocationInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Main Office, Warehouse A"
                  required
                />

                <label>Branch Code:</label>
                <input
                  type="text"
                  className="win98-input"
                  value={formData.branch_code}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateLocationInput) => ({ ...prev, branch_code: e.target.value }))
                  }
                  placeholder="e.g., HQ, WH01, BR02"
                  required
                />

                <label>Address:</label>
                <textarea
                  className="win98-textarea"
                  value={formData.address || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateLocationInput) => ({ ...prev, address: e.target.value || null }))
                  }
                  rows={3}
                  placeholder="Optional full address"
                />
              </div>

              <div className="form-row">
                <button type="submit" className="win98-button-primary" disabled={loading}>
                  {loading ? 'Saving...' : editingLocation ? 'Update' : 'Create'}
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
              <th>Name</th>
              <th>Branch Code</th>
              <th>Address</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((location: Location) => (
              <tr key={location.id}>
                <td>{location.name}</td>
                <td>
                  <code style={{ 
                    background: '#f0f0f0', 
                    padding: '2px 4px', 
                    border: '1px solid #ccc',
                    fontSize: '10px'
                  }}>
                    {location.branch_code}
                  </code>
                </td>
                <td>
                  {location.address ? (
                    <span title={location.address}>
                      {location.address.length > 50 ? location.address.substring(0, 50) + '...' : location.address}
                    </span>
                  ) : (
                    <em style={{ color: '#999' }}>No address</em>
                  )}
                </td>
                <td>{location.created_at.toLocaleDateString()}</td>
                <td>
                  <button 
                    className="win98-button" 
                    onClick={() => handleEdit(location)}
                    style={{ marginRight: '4px' }}
                  >
                    Edit
                  </button>
                  <button 
                    className="win98-button" 
                    onClick={() => handleDelete(location.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {locations.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#808080' }}>
            No locations found. Click "Add New Location" to get started.
          </div>
        )}
      </div>
    </div>
  );
}