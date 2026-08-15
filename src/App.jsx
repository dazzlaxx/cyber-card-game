// ГЛАВНЫЙ КОМПОНЕНТ ПРИЛОЖЕНИЯ

import React, { useState, useEffect } from 'react';
import { GameBoard } from './components/GameBoard';
import { Auth } from './components/Auth';
import { Profile } from './components/Profile';
import { useGameStats } from './hooks/useGameStats';
import './styles/app.css';

const CURRENT_USER_KEY = 'cyberGameCurrentUser';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const { stats, clearStats } = useGameStats();

  // Проверяем, есть ли сохранённый пользователь
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

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem(CURRENT_USER_KEY);
    setUser(null);
    setShowProfile(false);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">⏳ Загрузка...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="App">
      {/* Кнопка профиля - всегда видна в правом верхнем углу */}
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
      />

      {/* Модальное окно профиля */}
      {showProfile && (
        <Profile
          user={user}
          stats={stats}
          onClose={() => setShowProfile(false)}
          onLogout={handleLogout}
          clearStats={clearStats}
        />
      )}
    </div>
  );
}

export default App;