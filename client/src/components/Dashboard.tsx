import { useState, useEffect } from 'react';
import { trpc } from '@/utils/trpc';
import { useLanguage } from './LanguageContext';
import type { DashboardStats } from '../../../server/src/schema';

export function Dashboard() {
  const { t } = useLanguage();
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
        <div className="win98-group-title">📊 {t('dashboard.title')}</div>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          {t('dashboard.loading')}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="win98-group">
        <div className="win98-group-title">📊 {t('dashboard.title')}</div>
        <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
          {t('dashboard.noData')}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="win98-group">
        <div className="win98-group-title">📊 {t('dashboard.title')}</div>
        
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.total_items}</div>
            <div className="stat-label">{t('dashboard.totalItems')}</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value">{stats.total_categories}</div>
            <div className="stat-label">{t('dashboard.totalCategories')}</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value">{stats.total_locations}</div>
            <div className="stat-label">{t('dashboard.totalLocations')}</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value">{stats.total_suppliers}</div>
            <div className="stat-label">{t('dashboard.totalSuppliers')}</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value">{stats.recent_purchases}</div>
            <div className="stat-label">{t('dashboard.recentPurchases')}</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value">{stats.recent_transfers}</div>
            <div className="stat-label">{t('dashboard.recentTransfers')}</div>
          </div>
        </div>
      </div>

      <div className="win98-group">
        <div className="win98-group-title">📦 {t('dashboard.itemsByCondition')}</div>
        <table className="win98-table">
          <thead>
            <tr>
              <th>{t('inventory.condition')}</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(stats.items_by_condition).map(([condition, count]) => (
              <tr key={condition}>
                <td>
                  <span className={`status-${condition}`}>
                    {t(`inventory.conditions.${condition}` as any) || condition.charAt(0).toUpperCase() + condition.slice(1)}
                  </span>
                </td>
                <td>{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="win98-group">
        <div className="win98-group-title">📍 {t('dashboard.itemsByLocation')}</div>
        <table className="win98-table">
          <thead>
            <tr>
              <th>{t('locations.name')}</th>
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