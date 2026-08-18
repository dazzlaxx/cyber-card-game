// ============================================================
// КОМПОНЕНТ ПРОФИЛЯ ИГРОКА
// ============================================================

import React, { useState, useEffect } from 'react';
import { Stats } from './Stats';
import { History } from './History';

export function Profile({ user, stats, onClose, onLogout, clearStats, theme }) {
  const [showStats, setShowStats] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Синхронизация темы
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const winRate = stats.totalGames === 0 ? 0 : Math.round((stats.wins / stats.totalGames) * 100);
  const hackerWinRate = stats.asHacker.games === 0 ? 0 : Math.round((stats.asHacker.wins / stats.asHacker.games) * 100);
  const companyWinRate = stats.asCompany.games === 0 ? 0 : Math.round((stats.asCompany.wins / stats.asCompany.games) * 100);

  const formatDate = (dateString) => {
    if (!dateString) return 'Неизвестно';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Неизвестно';
      return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Неизвестно';
    }
  };

  const handleCloseStats = () => {
    setShowStats(false);
  };

  const handleCloseHistory = () => {
    setShowHistory(false);
  };

  return (
    <>
      {/* ===== ПРОФИЛЬ ===== */}
      <div className="profile-overlay" data-theme={theme}>
        <div className="profile-box">
          {/* Заголовок */}
          <div className="profile-header">
            <div className="profile-header-left">
              <span className="profile-avatar">👤</span>
              <div>
                <h2>{user.displayName}</h2>
                <p className="profile-username">@{user.username}</p>
              </div>
            </div>
            <button className="profile-close" onClick={onClose}>✕</button>
          </div>

          {/* Информация об аккаунте */}
          <div className="profile-info">
            <div className="profile-info-item">
              <span className="info-label">📅 Дата регистрации</span>
              <span className="info-value">{formatDate(user.createdAt)}</span>
            </div>
            <div className="profile-info-item">
              <span className="info-label">🎮 Всего игр</span>
              <span className="info-value">{stats.totalGames}</span>
            </div>
          </div>

          {/* Статистика в профиле */}
          <div className="profile-stats-preview">
            <div className="profile-stat-card">
              <div className="stat-icon">🏆</div>
              <div className="stat-info">
                <span className="stat-value">{stats.wins}</span>
                <span className="stat-label">Победы</span>
              </div>
            </div>
            <div className="profile-stat-card">
              <div className="stat-icon">💀</div>
              <div className="stat-info">
                <span className="stat-value">{stats.losses}</span>
                <span className="stat-label">Поражения</span>
              </div>
            </div>
            <div className="profile-stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-info">
                <span className="stat-value">{winRate}%</span>
                <span className="stat-label">Процент побед</span>
              </div>
            </div>
            <div className="profile-stat-card">
              <div className="stat-icon">⚔️</div>
              <div className="stat-info">
                <span className="stat-value">{stats.totalDamageDealt}</span>
                <span className="stat-label">Нанесено урона</span>
              </div>
            </div>
          </div>

          {/* Статистика по ролям */}
          <div className="profile-roles">
            <h4>🎭 Статистика по ролям</h4>
            <div className="profile-roles-grid">
              <div className="profile-role-card">
                <span className="role-icon">🕵️</span>
                <span className="role-name">Хакер</span>
                <div className="role-stats-mini">
                  <span>Игр: {stats.asHacker.games}</span>
                  <span>Побед: {stats.asHacker.wins}</span>
                  <span className={hackerWinRate >= 50 ? 'rate-good' : 'rate-bad'}>
                    {hackerWinRate}%
                  </span>
                </div>
              </div>
              <div className="profile-role-card">
                <span className="role-icon">🏢</span>
                <span className="role-name">Компания</span>
                <div className="role-stats-mini">
                  <span>Игр: {stats.asCompany.games}</span>
                  <span>Побед: {stats.asCompany.wins}</span>
                  <span className={companyWinRate >= 50 ? 'rate-good' : 'rate-bad'}>
                    {companyWinRate}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="profile-actions">
            <button 
              className="profile-btn profile-btn-stats"
              onClick={() => setShowStats(true)}
            >
              📊 Полная статистика
            </button>
            <button 
              className="profile-btn profile-btn-history"
              onClick={() => setShowHistory(true)}
            >
              📜 История игр
            </button>
            <button 
              className="profile-btn profile-btn-logout"
              onClick={() => {
                if (window.confirm('Вы уверены, что хотите выйти из аккаунта?')) {
                  onLogout();
                }
              }}
            >
              🔓 Выйти из аккаунта
            </button>
          </div>

          {/* Версия */}
          <div className="profile-version">
            <span>Cyber Conflict v1.0.0</span>
          </div>
        </div>
      </div>

      {/* ===== МОДАЛЬНОЕ ОКНО СТАТИСТИКИ ===== */}
      {showStats && (
        <Stats
          stats={stats}
          onClose={handleCloseStats}
          onClear={() => {
            if (window.confirm('Вы уверены, что хотите очистить всю статистику?')) {
              clearStats();
            }
          }}
          theme={theme}
        />
      )}

      {/* ===== МОДАЛЬНОЕ ОКНО ИСТОРИИ ===== */}
      {showHistory && (
        <History
          history={stats.history}
          onClose={handleCloseHistory}
          theme={theme}
        />
      )}
    </>
  );
}