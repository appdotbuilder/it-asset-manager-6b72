import { useState, useEffect } from 'react';
import { trpc } from '@/utils/trpc';
import type { DashboardStats } from '../../../server/src/schema';

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const result = await trpc.dashboard.getStats.query();
        setStats(result);
      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="win98-group">
        <div className="win98-group-title">📊 Dashboard</div>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          Loading dashboard data...
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="win98-group">
        <div className="win98-group-title">📊 Dashboard</div>
        <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
          Failed to load dashboard data
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="win98-group">
        <div className="win98-group-title">📊 System Overview</div>
        
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.total_items}</div>
            <div className="stat-label">Total Items</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value">{stats.total_categories}</div>
            <div className="stat-label">Categories</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value">{stats.total_locations}</div>
            <div className="stat-label">Locations</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value">{stats.total_suppliers}</div>
            <div className="stat-label">Suppliers</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value">{stats.recent_purchases}</div>
            <div className="stat-label">Recent Purchases</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value">{stats.recent_transfers}</div>
            <div className="stat-label">Recent Transfers</div>
          </div>
        </div>
      </div>

      <div className="win98-group">
        <div className="win98-group-title">📦 Items by Condition</div>
        <table className="win98-table">
          <thead>
            <tr>
              <th>Condition</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(stats.items_by_condition).map(([condition, count]) => (
              <tr key={condition}>
                <td>
                  <span className={`status-${condition}`}>
                    {condition.charAt(0).toUpperCase() + condition.slice(1)}
                  </span>
                </td>
                <td>{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="win98-group">
        <div className="win98-group-title">📍 Items by Location</div>
        <table className="win98-table">
          <thead>
            <tr>
              <th>Location</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(stats.items_by_location).map(([location, count]) => (
              <tr key={location}>
                <td>{location}</td>
                <td>{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}