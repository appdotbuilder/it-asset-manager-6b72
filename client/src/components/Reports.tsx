import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import type { 
  InventoryReportFilter,
  PurchaseReportFilter,
  LocationHistoryReportFilter,
  Category,
  Location,
  Supplier
} from '../../../server/src/schema';

export function Reports() {
  const [activeTab, setActiveTab] = useState<string>('inventory');
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  // Filter states
  const [inventoryFilter, setInventoryFilter] = useState<InventoryReportFilter>({});
  const [purchaseFilter, setPurchaseFilter] = useState<PurchaseReportFilter>({});
  const [historyFilter, setHistoryFilter] = useState<LocationHistoryReportFilter>({});

  const loadMasterData = useCallback(async () => {
    try {
      const [categoriesResult, locationsResult, suppliersResult] = await Promise.all([
        trpc.categories.getAll.query(),
        trpc.locations.getAll.query(),
        trpc.suppliers.getAll.query()
      ]);

      setCategories(categoriesResult);
      setLocations(locationsResult);
      setSuppliers(suppliersResult);
    } catch (error) {
      console.error('Failed to load master data:', error);
    }
  }, []);

  useEffect(() => {
    loadMasterData();
  }, [loadMasterData]);

  const generateInventoryReport = async () => {
    setLoading(true);
    try {
      const result = await trpc.reports.inventory.query(inventoryFilter);
      setReportData(result);
    } catch (error) {
      console.error('Failed to generate inventory report:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInventorySummary = async () => {
    setLoading(true);
    try {
      const result = await trpc.reports.inventorySummary.query(inventoryFilter);
      setReportData(result);
    } catch (error) {
      console.error('Failed to generate inventory summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePurchaseReport = async () => {
    setLoading(true);
    try {
      const result = await trpc.reports.purchases.query(purchaseFilter);
      setReportData(result);
    } catch (error) {
      console.error('Failed to generate purchase report:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePurchaseSummary = async () => {
    setLoading(true);
    try {
      const result = await trpc.reports.purchasesSummary.query(purchaseFilter);
      setReportData(result);
    } catch (error) {
      console.error('Failed to generate purchase summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateLocationHistoryReport = async () => {
    setLoading(true);
    try {
      const result = await trpc.reports.locationHistory.query(historyFilter);
      setReportData(result);
    } catch (error) {
      console.error('Failed to generate location history report:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearReport = () => {
    setReportData(null);
  };

  const renderInventoryTab = () => (
    <div className="win98-tab-content">
      <div className="win98-group">
        <div className="win98-group-title">📊 Inventory Report Filters</div>
        
        <div className="form-grid">
          <label>Category:</label>
          <select
            className="win98-select"
            value={inventoryFilter.category_id || 0}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setInventoryFilter((prev: InventoryReportFilter) => ({ 
                ...prev, 
                category_id: parseInt(e.target.value) || undefined 
              }))
            }
          >
            <option value={0}>All Categories</option>
            {categories.map((category: Category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <label>Location:</label>
          <select
            className="win98-select"
            value={inventoryFilter.location_id || 0}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setInventoryFilter((prev: InventoryReportFilter) => ({ 
                ...prev, 
                location_id: parseInt(e.target.value) || undefined 
              }))
            }
          >
            <option value={0}>All Locations</option>
            {locations.map((location: Location) => (
              <option key={location.id} value={location.id}>
                {location.name} ({location.branch_code})
              </option>
            ))}
          </select>

          <label>Condition:</label>
          <select
            className="win98-select"
            value={inventoryFilter.condition || ''}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setInventoryFilter((prev: InventoryReportFilter) => ({ 
                ...prev, 
                condition: e.target.value as any || undefined 
              }))
            }
          >
            <option value="">All Conditions</option>
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
            <option value="damaged">Damaged</option>
          </select>

          <label>Date From:</label>
          <input
            type="date"
            className="win98-input"
            value={inventoryFilter.date_from ? inventoryFilter.date_from.toISOString().split('T')[0] : ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setInventoryFilter((prev: InventoryReportFilter) => ({ 
                ...prev, 
                date_from: e.target.value ? new Date(e.target.value) : undefined 
              }))
            }
          />

          <label>Date To:</label>
          <input
            type="date"
            className="win98-input"
            value={inventoryFilter.date_to ? inventoryFilter.date_to.toISOString().split('T')[0] : ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setInventoryFilter((prev: InventoryReportFilter) => ({ 
                ...prev, 
                date_to: e.target.value ? new Date(e.target.value) : undefined 
              }))
            }
          />
        </div>

        <div className="form-row">
          <button className="win98-button-primary" onClick={generateInventoryReport} disabled={loading}>
            Generate Detailed Report
          </button>
          <button className="win98-button" onClick={generateInventorySummary} disabled={loading}>
            Generate Summary
          </button>
          <button className="win98-button" onClick={clearReport}>
            Clear Report
          </button>
        </div>
      </div>
    </div>
  );

  const renderPurchaseTab = () => (
    <div className="win98-tab-content">
      <div className="win98-group">
        <div className="win98-group-title">🛒 Purchase Report Filters</div>
        
        <div className="form-grid">
          <label>Supplier:</label>
          <select
            className="win98-select"
            value={purchaseFilter.supplier_id || 0}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setPurchaseFilter((prev: PurchaseReportFilter) => ({ 
                ...prev, 
                supplier_id: parseInt(e.target.value) || undefined 
              }))
            }
          >
            <option value={0}>All Suppliers</option>
            {suppliers.map((supplier: Supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>

          <label>Date From:</label>
          <input
            type="date"
            className="win98-input"
            value={purchaseFilter.date_from ? purchaseFilter.date_from.toISOString().split('T')[0] : ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPurchaseFilter((prev: PurchaseReportFilter) => ({ 
                ...prev, 
                date_from: e.target.value ? new Date(e.target.value) : undefined 
              }))
            }
          />

          <label>Date To:</label>
          <input
            type="date"
            className="win98-input"
            value={purchaseFilter.date_to ? purchaseFilter.date_to.toISOString().split('T')[0] : ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPurchaseFilter((prev: PurchaseReportFilter) => ({ 
                ...prev, 
                date_to: e.target.value ? new Date(e.target.value) : undefined 
              }))
            }
          />
        </div>

        <div className="form-row">
          <button className="win98-button-primary" onClick={generatePurchaseReport} disabled={loading}>
            Generate Detailed Report
          </button>
          <button className="win98-button" onClick={generatePurchaseSummary} disabled={loading}>
            Generate Summary
          </button>
          <button className="win98-button" onClick={clearReport}>
            Clear Report
          </button>
        </div>
      </div>
    </div>
  );

  const renderLocationHistoryTab = () => (
    <div className="win98-tab-content">
      <div className="win98-group">
        <div className="win98-group-title">📋 Location History Report Filters</div>
        
        <div className="form-grid">
          <label>Location:</label>
          <select
            className="win98-select"
            value={historyFilter.location_id || 0}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setHistoryFilter((prev: LocationHistoryReportFilter) => ({ 
                ...prev, 
                location_id: parseInt(e.target.value) || undefined 
              }))
            }
          >
            <option value={0}>All Locations</option>
            {locations.map((location: Location) => (
              <option key={location.id} value={location.id}>
                {location.name} ({location.branch_code})
              </option>
            ))}
          </select>

          <label>Status:</label>
          <select
            className="win98-select"
            value={historyFilter.status || ''}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setHistoryFilter((prev: LocationHistoryReportFilter) => ({ 
                ...prev, 
                status: e.target.value as any || undefined 
              }))
            }
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_transit">In Transit</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <label>Date From:</label>
          <input
            type="date"
            className="win98-input"
            value={historyFilter.date_from ? historyFilter.date_from.toISOString().split('T')[0] : ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setHistoryFilter((prev: LocationHistoryReportFilter) => ({ 
                ...prev, 
                date_from: e.target.value ? new Date(e.target.value) : undefined 
              }))
            }
          />

          <label>Date To:</label>
          <input
            type="date"
            className="win98-input"
            value={historyFilter.date_to ? historyFilter.date_to.toISOString().split('T')[0] : ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setHistoryFilter((prev: LocationHistoryReportFilter) => ({ 
                ...prev, 
                date_to: e.target.value ? new Date(e.target.value) : undefined 
              }))
            }
          />
        </div>

        <div className="form-row">
          <button className="win98-button-primary" onClick={generateLocationHistoryReport} disabled={loading}>
            Generate Report
          </button>
          <button className="win98-button" onClick={clearReport}>
            Clear Report
          </button>
        </div>
      </div>
    </div>
  );

  const renderReportData = () => {
    if (!reportData) return null;

    if (Array.isArray(reportData)) {
      if (reportData.length === 0) {
        return (
          <div style={{ textAlign: 'center', padding: '20px', color: '#808080' }}>
            No data found for the selected criteria.
          </div>
        );
      }

      // Render as table for array data
      const firstItem = reportData[0];
      const columns = Object.keys(firstItem);

      return (
        <table className="win98-table">
          <thead>
            <tr>
              {columns.map((col: string) => (
                <th key={col}>{col.replace(/_/g, ' ').toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reportData.map((item: any, index: number) => (
              <tr key={index}>
                {columns.map((col: string) => (
                  <td key={col}>
                    {typeof item[col] === 'number' 
                      ? col.includes('price') || col.includes('total') 
                        ? `$${item[col].toFixed(2)}`
                        : item[col]
                      : typeof item[col] === 'object' && item[col] instanceof Date
                        ? item[col].toLocaleDateString()
                        : String(item[col] || '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    } else {
      // Render as summary for object data
      return (
        <div className="stats-grid">
          {Object.entries(reportData).map(([key, value]) => (
            <div key={key} className="stat-card">
              <div className="stat-value">
                {typeof value === 'number' 
                  ? key.includes('total') && key.includes('value')
                    ? `$${value.toFixed(2)}`
                    : value.toLocaleString()
                  : String(value)}
              </div>
              <div className="stat-label">
                {key.replace(/_/g, ' ').toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      );
    }
  };

  return (
    <div>
      <div className="win98-group">
        <div className="win98-group-title">📊 Reports</div>
        
        <div className="win98-tabs">
          <div className="win98-tab-list">
            <button 
              className={`win98-tab ${activeTab === 'inventory' ? 'active' : ''}`}
              onClick={() => setActiveTab('inventory')}
            >
              Inventory Reports
            </button>
            <button 
              className={`win98-tab ${activeTab === 'purchases' ? 'active' : ''}`}
              onClick={() => setActiveTab('purchases')}
            >
              Purchase Reports
            </button>
            <button 
              className={`win98-tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              Transfer Reports
            </button>
          </div>

          {activeTab === 'inventory' && renderInventoryTab()}
          {activeTab === 'purchases' && renderPurchaseTab()}
          {activeTab === 'history' && renderLocationHistoryTab()}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            Generating report...
          </div>
        )}

        {reportData && (
          <div className="win98-group">
            <div className="win98-group-title">📋 Report Results</div>
            {renderReportData()}
          </div>
        )}
      </div>
    </div>
  );
}