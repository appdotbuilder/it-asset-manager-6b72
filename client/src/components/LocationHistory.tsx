import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import type { 
  LocationHistory as LocationHistoryType, 
  CreateLocationHistoryInput, 
  UpdateLocationHistoryInput,
  InventoryItem,
  Location 
} from '../../../server/src/schema';

interface LocationHistoryWithDetails extends LocationHistoryType {
  item_name?: string;
  item_code?: string;
  from_location_name?: string;
  to_location_name?: string;
}

export function LocationHistory() {
  const [history, setHistory] = useState<LocationHistoryWithDetails[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingHistory, setEditingHistory] = useState<LocationHistoryWithDetails | null>(null);

  const [formData, setFormData] = useState<CreateLocationHistoryInput>({
    item_id: 0,
    from_location_id: null,
    to_location_id: 0,
    transfer_date: new Date(),
    transferred_by: '',
    reason: null,
    status: 'pending',
    notes: null
  });

  const loadData = useCallback(async () => {
    try {
      const [historyResult, itemsResult, locationsResult] = await Promise.all([
        trpc.locationHistory.getAll.query(),
        trpc.inventory.getAll.query(),
        trpc.locations.getAll.query()
      ]);

      // Enhance history with item and location details
      const historyWithDetails = historyResult.map((history: LocationHistoryType) => {
        const item = itemsResult.find((item: InventoryItem) => item.id === history.item_id);
        const fromLocation = locationsResult.find((loc: Location) => loc.id === history.from_location_id);
        const toLocation = locationsResult.find((loc: Location) => loc.id === history.to_location_id);
        
        return {
          ...history,
          item_name: item?.name,
          item_code: item?.item_code,
          from_location_name: fromLocation?.name,
          to_location_name: toLocation?.name
        };
      });

      setHistory(historyWithDetails);
      setItems(itemsResult);
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
      if (editingHistory) {
        const updateData: UpdateLocationHistoryInput = {
          id: editingHistory.id,
          status: formData.status,
          notes: formData.notes
        };
        await trpc.locationHistory.update.mutate(updateData);
      } else {
        await trpc.locationHistory.create.mutate(formData);
      }
      
      await loadData();
      resetForm();
    } catch (error) {
      console.error('Failed to save location history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (historyItem: LocationHistoryWithDetails) => {
    setEditingHistory(historyItem);
    setFormData({
      item_id: historyItem.item_id,
      from_location_id: historyItem.from_location_id,
      to_location_id: historyItem.to_location_id,
      transfer_date: historyItem.transfer_date,
      transferred_by: historyItem.transferred_by,
      reason: historyItem.reason,
      status: historyItem.status,
      notes: historyItem.notes
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this transfer record?')) return;
    
    try {
      await trpc.locationHistory.delete.mutate({ id });
      await loadData();
    } catch (error) {
      console.error('Failed to delete location history:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      item_id: 0,
      from_location_id: null,
      to_location_id: 0,
      transfer_date: new Date(),
      transferred_by: '',
      reason: null,
      status: 'pending',
      notes: null
    });
    setEditingHistory(null);
    setShowForm(false);
  };

  if (loading && history.length === 0) {
    return (
      <div className="win98-group">
        <div className="win98-group-title">📋 Location History</div>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          Loading location history data...
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="win98-group">
        <div className="win98-group-title">📋 Location History</div>
        
        <div className="form-row">
          <button 
            className="win98-button-primary" 
            onClick={() => setShowForm(true)}
          >
            Record Transfer
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
              {editingHistory ? 'Edit Transfer Record' : 'Record New Transfer'}
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <label>Item:</label>
                <select
                  className="win98-select"
                  value={formData.item_id}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setFormData((prev: CreateLocationHistoryInput) => ({ ...prev, item_id: parseInt(e.target.value) }))
                  }
                  required
                  disabled={editingHistory !== null}
                >
                  <option value={0}>Select Item</option>
                  {items.map((item: InventoryItem) => (
                    <option key={item.id} value={item.id}>
                      {item.item_code} - {item.name}
                    </option>
                  ))}
                </select>

                <label>From Location:</label>
                <select
                  className="win98-select"
                  value={formData.from_location_id || 0}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setFormData((prev: CreateLocationHistoryInput) => ({ 
                      ...prev, 
                      from_location_id: parseInt(e.target.value) || null 
                    }))
                  }
                  disabled={editingHistory !== null}
                >
                  <option value={0}>New Item (No Previous Location)</option>
                  {locations.map((location: Location) => (
                    <option key={location.id} value={location.id}>
                      {location.name} ({location.branch_code})
                    </option>
                  ))}
                </select>

                <label>To Location:</label>
                <select
                  className="win98-select"
                  value={formData.to_location_id}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setFormData((prev: CreateLocationHistoryInput) => ({ ...prev, to_location_id: parseInt(e.target.value) }))
                  }
                  required
                  disabled={editingHistory !== null}
                >
                  <option value={0}>Select Destination</option>
                  {locations.map((location: Location) => (
                    <option key={location.id} value={location.id}>
                      {location.name} ({location.branch_code})
                    </option>
                  ))}
                </select>

                <label>Transfer Date:</label>
                <input
                  type="date"
                  className="win98-input"
                  value={formData.transfer_date.toISOString().split('T')[0]}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateLocationHistoryInput) => ({ ...prev, transfer_date: new Date(e.target.value) }))
                  }
                  required
                  disabled={editingHistory !== null}
                />

                <label>Transferred By:</label>
                <input
                  type="text"
                  className="win98-input"
                  value={formData.transferred_by}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateLocationHistoryInput) => ({ ...prev, transferred_by: e.target.value }))
                  }
                  placeholder="Name of person handling the transfer"
                  required
                  disabled={editingHistory !== null}
                />

                <label>Reason:</label>
                <select
                  className="win98-select"
                  value={formData.reason || ''}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setFormData((prev: CreateLocationHistoryInput) => ({ ...prev, reason: e.target.value || null }))
                  }
                  disabled={editingHistory !== null}
                >
                  <option value="">Select Reason</option>
                  <option value="relocation">Relocation</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="replacement">Replacement</option>
                  <option value="redistribution">Redistribution</option>
                  <option value="storage">Storage</option>
                  <option value="disposal">Disposal</option>
                  <option value="other">Other</option>
                </select>

                <label>Status:</label>
                <select
                  className="win98-select"
                  value={formData.status}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setFormData((prev: CreateLocationHistoryInput) => ({ ...prev, status: e.target.value as any }))
                  }
                >
                  <option value="pending">Pending</option>
                  <option value="in_transit">In Transit</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <label>Notes:</label>
                <textarea
                  className="win98-textarea"
                  value={formData.notes || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateLocationHistoryInput) => ({ ...prev, notes: e.target.value || null }))
                  }
                  rows={3}
                  placeholder="Optional notes about this transfer..."
                />
              </div>

              <div className="form-row">
                <button type="submit" className="win98-button-primary" disabled={loading}>
                  {loading ? 'Saving...' : editingHistory ? 'Update Status' : 'Record Transfer'}
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
              <th>From</th>
              <th>To</th>
              <th>Date</th>
              <th>Transferred By</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {history.map((historyItem: LocationHistoryWithDetails) => (
              <tr key={historyItem.id}>
                <td>
                  <div>{historyItem.item_name}</div>
                  <small style={{ color: '#666' }}>{historyItem.item_code}</small>
                </td>
                <td>
                  {historyItem.from_location_name ? (
                    historyItem.from_location_name
                  ) : (
                    <em style={{ color: '#999' }}>New Item</em>
                  )}
                </td>
                <td>{historyItem.to_location_name}</td>
                <td>{historyItem.transfer_date.toLocaleDateString()}</td>
                <td>{historyItem.transferred_by}</td>
                <td>
                  {historyItem.reason ? (
                    historyItem.reason.charAt(0).toUpperCase() + historyItem.reason.slice(1)
                  ) : (
                    <em style={{ color: '#999' }}>Not specified</em>
                  )}
                </td>
                <td>
                  <span className={`status-${historyItem.status}`}>
                    {historyItem.status.replace('_', ' ').charAt(0).toUpperCase() + 
                     historyItem.status.replace('_', ' ').slice(1)}
                  </span>
                </td>
                <td>
                  {historyItem.notes && (
                    <span title={historyItem.notes}>
                      {historyItem.notes.length > 20 ? historyItem.notes.substring(0, 20) + '...' : historyItem.notes}
                    </span>
                  )}
                </td>
                <td>
                  <button 
                    className="win98-button" 
                    onClick={() => handleEdit(historyItem)}
                    style={{ marginRight: '4px' }}
                  >
                    Edit
                  </button>
                  <button 
                    className="win98-button" 
                    onClick={() => handleDelete(historyItem.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {history.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#808080' }}>
            No transfer records found. Click "Record Transfer" to get started.
          </div>
        )}
      </div>
    </div>
  );
}