// ============================================================
// КОМПОНЕНТ АВТОРИЗАЦИИ
// ============================================================

import React, { useState, useEffect } from 'react';

const USERS_KEY = 'cyberGameUsers';
const CURRENT_USER_KEY = 'cyberGameCurrentUser';
const THEME_KEY = 'cyberGameTheme';

// Демо-аккаунт
const DEMO_USER = {
  username: 'guest',
  displayName: 'Гость',
  password: 'guest',
  createdAt: new Date().toISOString()
};

const loadUsers = () => {
  const saved = localStorage.getItem(USERS_KEY);
  if (saved) {
    try {
      const users = JSON.parse(saved);
      if (!users['guest']) {
        users['guest'] = DEMO_USER;
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
      }
      return users;
    } catch {
      return { guest: DEMO_USER };
    }
  }
  return { guest: DEMO_USER };
};

const saveUsers = (users) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export function Auth({ onLogin, theme }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState(loadUsers);

  // Синхронизация темы при монтировании
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Введите имя пользователя и пароль');
      return;
    }

    const trimmedUsername = username.trim().toLowerCase();

    if (isRegister) {
      if (users[trimmedUsername]) {
        setError('Пользователь с таким именем уже существует');
        return;
      }

      if (password.length < 4) {
        setError('Пароль должен содержать минимум 4 символа');
        return;
      }

      const newUsers = {
        ...users,
        [trimmedUsername]: {
          username: trimmedUsername,
          displayName: username.trim(),
          password: password,
          createdAt: new Date().toISOString()
        }
      };

      saveUsers(newUsers);
      setUsers(newUsers);

      const userData = {
        username: trimmedUsername,
        displayName: username.trim(),
        createdAt: new Date().toISOString()
      };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
      onLogin(userData);

    } else {
      const user = users[trimmedUsername];
      if (!user) {
        setError('Пользователь не найден');
        return;
      }
      if (user.password !== password) {
        setError('Неверный пароль');
        return;
      }

      const userData = {
        username: trimmedUsername,
        displayName: user.displayName,
        createdAt: user.createdAt
      };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
      onLogin(userData);
    }
  };

  // Функция для переключения темы
  const handleToggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    // Отправляем событие для синхронизации с App
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: newTheme } }));
  };

  return (
    <div className="auth-container" data-theme={theme}>
      {/* Кнопка темы на экране авторизации */}
      <button 
        className="theme-toggle-auth"
        onClick={handleToggleTheme}
        title={theme === 'light' ? '🌙 Тёмная тема' : '☀️ Светлая тема'}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>

      <div className="auth-box">
        <div className="auth-logo">🛡️</div>
        <h1>Cyber Conflict</h1>
        <p className="auth-subtitle">
          {isRegister ? 'Создайте аккаунт' : 'Войдите в игру'}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label>👤 Имя пользователя</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Введите имя"
              autoFocus
            />
          </div>

          <div className="auth-field">
            <label>🔒 Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isRegister ? 'Минимум 4 символа' : 'Введите пароль'}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-btn">
            {isRegister ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </form>

        <button
          className="auth-switch"
          onClick={() => {
            setIsRegister(!isRegister);
            setError('');
          }}
        >
          {isRegister
            ? 'Уже есть аккаунт? Войти'
            : 'Нет аккаунта? Зарегистрироваться'}
        </button>

        <div className="auth-demo">
          <span>👆 Демо-аккаунт: guest / guest</span>
        </div>
      </div>
    </div>
  );
}