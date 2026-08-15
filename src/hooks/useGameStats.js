// ХУК ДЛЯ УПРАВЛЕНИЯ СТАТИСТИКОЙ ИГРОКА

import { useState, useEffect } from 'react';

// Ключ для localStorage
const STORAGE_KEY = 'cyberGameStats';

// Функция для загрузки статистики из localStorage
const loadStats = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return getDefaultStats();
    }
  }
  return getDefaultStats();
};

// Функция для сохранения статистики в localStorage
const saveStats = (stats) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
};

// Статистика по умолчанию
const getDefaultStats = () => ({
  totalGames: 0,
  wins: 0,
  losses: 0,
  asHacker: { games: 0, wins: 0, losses: 0 },
  asCompany: { games: 0, wins: 0, losses: 0 },
  totalDamageDealt: 0,
  totalDamageTaken: 0,
  cardsUsed: 0,
  defensesUsed: 0,
  history: [] // массив записей об играх
});

export function useGameStats() {
  const [stats, setStats] = useState(loadStats);

  // Сохраняем при изменении
  useEffect(() => {
    saveStats(stats);
  }, [stats]);

  // Добавить новую игру
  const addGame = (gameData) => {
    const { role, won, damageDealt, damageTaken, cardsUsed, defensesUsed, rounds, opponent } = gameData;

    setStats(prev => {
      const newStats = { ...prev };
      
      // Общая статистика
      newStats.totalGames += 1;
      if (won) {
        newStats.wins += 1;
      } else {
        newStats.losses += 1;
      }

      // Статистика по роли
      const roleKey = role === 'hacker' ? 'asHacker' : 'asCompany';
      newStats[roleKey].games += 1;
      if (won) {
        newStats[roleKey].wins += 1;
      } else {
        newStats[roleKey].losses += 1;
      }

      // Урон и карты
      newStats.totalDamageDealt += damageDealt || 0;
      newStats.totalDamageTaken += damageTaken || 0;
      newStats.cardsUsed += cardsUsed || 0;
      newStats.defensesUsed += defensesUsed || 0;

      // Добавляем в историю
      newStats.history.unshift({
        id: Date.now(),
        date: new Date().toISOString(),
        role: role,
        won: won,
        damageDealt: damageDealt || 0,
        damageTaken: damageTaken || 0,
        cardsUsed: cardsUsed || 0,
        defensesUsed: defensesUsed || 0,
        rounds: rounds || 0,
        opponent: opponent || 'Боты'
      });

      // Ограничиваем историю 50 играми
      if (newStats.history.length > 50) {
        newStats.history = newStats.history.slice(0, 50);
      }

      return newStats;
    });
  };

  // Очистить статистику
  const clearStats = () => {
    setStats(getDefaultStats());
  };

  return {
    stats,
    addGame,
    clearStats,
    // Вспомогательные функции
    getWinRate: () => {
      if (stats.totalGames === 0) return 0;
      return Math.round((stats.wins / stats.totalGames) * 100);
    },
    getRoleWinRate: (role) => {
      const roleData = stats[role === 'hacker' ? 'asHacker' : 'asCompany'];
      if (roleData.games === 0) return 0;
      return Math.round((roleData.wins / roleData.games) * 100);
    }
  };
}