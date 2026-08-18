// ============================================================
// КОМПОНЕНТ СТАТИСТИКИ ИГРОКА
// ============================================================

import React, { useEffect } from 'react';

export function Stats({ stats, onClose, onClear, theme }) {
  // Синхронизация темы
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  const winRate = stats.totalGames === 0 ? 0 : Math.round((stats.wins / stats.totalGames) * 100);
  const hackerWinRate = stats.asHacker.games === 0 ? 0 : Math.round((stats.asHacker.wins / stats.asHacker.games) * 100);
  const companyWinRate = stats.asCompany.games === 0 ? 0 : Math.round((stats.asCompany.wins / stats.asCompany.games) * 100);

  return (
    <div className="stats-overlay" data-theme={theme} style={{ zIndex: 4000 }}>
      <div className="stats-box">
        <div className="stats-header">
          <h2>📊 Полная статистика</h2>
          <button className="stats-close" onClick={onClose}>✕</button>
        </div>

        <div className="stats-grid">
          <div className="stats-card">
            <h3>Всего игр</h3>
            <div className="stats-number">{stats.totalGames}</div>
          </div>
          <div className="stats-card stats-win">
            <h3>🏆 Победы</h3>
            <div className="stats-number">{stats.wins}</div>
          </div>
          <div className="stats-card stats-loss">
            <h3>💀 Поражения</h3>
            <div className="stats-number">{stats.losses}</div>
          </div>
          <div className="stats-card">
            <h3>📈 Процент побед</h3>
            <div className="stats-number">{winRate}%</div>
          </div>
        </div>

        <div className="stats-roles">
          <h3>🎭 По ролям</h3>
          <div className="stats-roles-grid">
            <div className="stats-role-card">
              <span className="role-icon">🕵️</span>
              <span className="role-name">Хакер</span>
              <div className="role-stats">
                <span>Игр: {stats.asHacker.games}</span>
                <span>Побед: {stats.asHacker.wins}</span>
                <span>Процент: {hackerWinRate}%</span>
              </div>
            </div>
            <div className="stats-role-card">
              <span className="role-icon">🏢</span>
              <span className="role-name">Компания</span>
              <div className="role-stats">
                <span>Игр: {stats.asCompany.games}</span>
                <span>Побед: {stats.asCompany.wins}</span>
                <span>Процент: {companyWinRate}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="stats-details">
          <h3>📋 Детали</h3>
          <div className="stats-details-grid">
            <div>
              <span className="label">Всего нанесено урона:</span>
              <span className="value">{stats.totalDamageDealt}</span>
            </div>
            <div>
              <span className="label">Всего получено урона:</span>
              <span className="value">{stats.totalDamageTaken}</span>
            </div>
            <div>
              <span className="label">Использовано карт атаки:</span>
              <span className="value">{stats.cardsUsed}</span>
            </div>
            <div>
              <span className="label">Использовано карт защиты:</span>
              <span className="value">{stats.defensesUsed}</span>
            </div>
          </div>
        </div>

        <div className="stats-actions">
          <button className="stats-btn stats-btn-clear" onClick={onClear}>
            🗑️ Очистить статистику
          </button>
          <button className="stats-btn stats-btn-close" onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}