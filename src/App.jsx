// ============================================================
// ГЛАВНЫЙ КОМПОНЕНТ ПРИЛОЖЕНИЯ
// ============================================================

import React, { useState, useEffect } from 'react';
import { GameBoard } from './components/GameBoard';
import { Auth } from './components/Auth';
import { Profile } from './components/Profile';
import { useGameStats } from './hooks/useGameStats';
import './styles/app.css';

const CURRENT_USER_KEY = 'cyberGameCurrentUser';
const THEME_KEY = 'cyberGameTheme';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem(THEME_KEY);
    return saved || 'light';
  });
  const { stats, clearStats } = useGameStats();

  // Применяем тему при загрузке и при изменении
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    // Принудительно обновляем все компоненты, использующие тему
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
  }, [theme]);

  useEffect(() => {
    const savedUser = localStorage.getItem(CURRENT_USER_KEY);
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  // Слушаем события смены темы из других компонентов
  useEffect(() => {
    const handleThemeChange = (e) => {
      if (e.detail && e.detail.theme) {
        setTheme(e.detail.theme);
      }
    };
    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem(CURRENT_USER_KEY);
    setUser(null);
    setShowProfile(false);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    // Отправляем событие для синхронизации
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: newTheme } }));
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">⏳ Загрузка...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={handleLogin} theme={theme} />;
  }

  return (
    <div className="App" data-theme={theme}>
      {/* ===== КНОПКА ТЕМЫ (левый верхний угол) ===== */}
      <button 
        className="theme-toggle-left"
        onClick={toggleTheme}
        title={theme === 'light' ? '🌙 Тёмная тема' : '☀️ Светлая тема'}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>

      {/* ===== КНОПКА ПРОФИЛЯ (правый верхний угол) ===== */}
      <button 
        className="profile-trigger"
        onClick={() => setShowProfile(true)}
        title="Профиль"
      >
        👤 {user.displayName}
      </button>

      <GameBoard 
        user={user} 
        onLogout={handleLogout}
        onShowProfile={() => setShowProfile(true)}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {showProfile && (
        <Profile
          user={user}
          stats={stats}
          onClose={() => setShowProfile(false)}
          onLogout={handleLogout}
          clearStats={clearStats}
          theme={theme}
        />
      )}
    </div>
  );
}

export default App;