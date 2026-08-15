// КОМПОНЕНТ ПРОФИЛЯ ИГРОКА

import React, { useState } from 'react';
import { Stats } from './Stats';
import { History } from './History';

export function Profile({ user, stats, onClose, onLogout, clearStats }) {
  const [showStats, setShowStats] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const winRate = stats.totalGames === 0 ? 0 : Math.round((stats.wins / stats.totalGames) * 100);
  const hackerWinRate = stats.asHacker.games === 0 ? 0 : Math.round((stats.asHacker.wins / stats.asHacker.games) * 100);
  const companyWinRate = stats.asCompany.games === 0 ? 0 : Math.round((stats.asCompany.wins / stats.asCompany.games) * 100);

  // Форматируем дату регистрации
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

  // Обработчик закрытия статистики
  const handleCloseStats = () => {
    setShowStats(false);
  };

  // Обработчик закрытия истории
  const handleCloseHistory = () => {
    setShowHistory(false);
  };

  return (
    <>
      {/* ===== ПРОФИЛЬ ===== */}
      <div className="profile-overlay">
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
        <div className="stats-overlay" style={{ zIndex: 4000 }}>
          <div className="stats-box">
            <div className="stats-header">
              <h2>📊 Полная статистика</h2>
              <button className="stats-close" onClick={handleCloseStats}>✕</button>
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
              <button className="stats-btn stats-btn-clear" onClick={() => {
                if (window.confirm('Вы уверены, что хотите очистить всю статистику?')) {
                  clearStats();
                  handleCloseStats();
                }
              }}>
                🗑️ Очистить статистику
              </button>
              <button className="stats-btn stats-btn-close" onClick={handleCloseStats}>
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== МОДАЛЬНОЕ ОКНО ИСТОРИИ ===== */}
      {showHistory && (
        <div className="history-overlay" style={{ zIndex: 4000 }}>
          <div className="history-box">
            <div className="history-header">
              <h2>📜 История игр</h2>
              <button className="history-close" onClick={handleCloseHistory}>✕</button>
            </div>

            {stats.history.length === 0 ? (
              <div className="history-empty">
                <p>😴 Вы ещё не сыграли ни одной игры</p>
                <p style={{ fontSize: '14px', color: '#95a5a6', marginTop: '8px' }}>
                  Начните играть, чтобы заполнить историю!
                </p>
              </div>
            ) : (
              <div className="history-list">
                {stats.history.map((game, index) => {
                  const formatDate = (dateString) => {
                    if (!dateString) return 'Неизвестно';
                    try {
                      const date = new Date(dateString);
                      if (isNaN(date.getTime())) return 'Неизвестно';
                      return date.toLocaleString('ru-RU', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });
                    } catch {
                      return 'Неизвестно';
                    }
                  };

                  return (
                    <div key={game.id || index} className={`history-item ${game.won ? 'won' : 'lost'}`}>
                      <div className="history-item-header">
                        <span className="history-date">{formatDate(game.date)}</span>
                        <span className={`history-result ${game.won ? 'win' : 'lose'}`}>
                          {game.won ? '🏆 Победа' : '💀 Поражение'}
                        </span>
                      </div>
                      <div className="history-item-details">
                        <span>🎭 Роль: {game.role === 'hacker' ? '🕵️ Хакер' : '🏢 Компания'}</span>
                        <span>⚔️ Урон: {game.damageDealt}</span>
                        <span>🛡️ Защит: {game.defensesUsed}</span>
                        <span>🔄 Раундов: {game.rounds || 0}</span>
                        <span>👤 Против: {game.opponent || 'Боты'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button className="history-close-btn" onClick={handleCloseHistory}>
              Закрыть
            </button>
          </div>
        </div>
      )}
    </>
  );
}