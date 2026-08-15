// КОМПОНЕНТ ИСТОРИИ ИГР
import React from 'react';

export function History({ history, onClose }) {
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
    <div className="history-overlay" style={{ zIndex: 2000 }}>
      <div className="history-box">
        <div className="history-header">
          <h2>📜 История игр</h2>
          <button className="history-close" onClick={onClose}>✕</button>
        </div>

        {history.length === 0 ? (
          <div className="history-empty">
            <p>😴 Вы ещё не сыграли ни одной игры</p>
            <p style={{ fontSize: '14px', color: '#95a5a6', marginTop: '8px' }}>
              Начните играть, чтобы заполнить историю!
            </p>
          </div>
        ) : (
          <div className="history-list">
            {history.map((game, index) => (
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
            ))}
          </div>
        )}

        <button className="history-close-btn" onClick={onClose}>
          Закрыть
        </button>
      </div>
    </div>
  );
}