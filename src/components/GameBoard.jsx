// ============================================================
// ГЛАВНЫЙ КОМПОНЕНТ ИГРЫ
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Hand } from './Hand';
import { Card } from './Card';
import { Stats } from './Stats';
import { History } from './History';
import {
  initializeGameWithBots,
  executeAttack,
  useDefenseCard,
  discardAndDraw,
  clearCompanyTemporaryDefenses,
  checkDefense,
  canPlayerActCheck
} from '../game/gameLogic';
import { createHackerBot, createCompanyBot } from '../game/botLogic';
import { characteristicNames, characteristicIcons } from '../data/characteristics';
import { useGameStats } from '../hooks/useGameStats';

// ============================================================
// ФУНКЦИЯ ДЛЯ ГЛУБОКОГО КОПИРОВАНИЯ СОСТОЯНИЯ
// ============================================================
const deepCopyGameState = (state) => {
  if (!state) return null;

  const copiedCompanies = state.companies.map(company => {
    if (company.isHuman) {
      return {
        ...company,
        hand: [...(company.hand || [])],
        permanentDefenses: [...(company.permanentDefenses || [])],
        temporaryDefenses: [...(company.temporaryDefenses || [])],
        revealedCharacteristics: [...(company.revealedCharacteristics || [])],
        hideCharacteristics: company.hideCharacteristics
      };
    } else {
      const bot = createCompanyBot(
        {
          id: company.id,
          name: company.name,
          characteristics: { ...company.characteristics }
        },
        company.difficulty || 'medium'
      );
      bot.health = company.health;
      bot.hand = [...(company.hand || [])];
      bot.permanentDefenses = [...(company.permanentDefenses || [])];
      bot.temporaryDefenses = [...(company.temporaryDefenses || [])];
      bot.isAlive = company.isAlive;
      bot.revealedCharacteristics = [...(company.revealedCharacteristics || [])];
      bot.hideCharacteristics = company.hideCharacteristics;
      return bot;
    }
  });

  const copiedHackers = state.hackers.map(hacker => {
    if (hacker.isHuman) {
      return {
        ...hacker,
        hand: [...(hacker.hand || [])]
      };
    } else {
      const botId = hacker.id.replace('hacker_bot_', '');
      const bot = createHackerBot(
        botId || '1',
        hacker.name,
        hacker.difficulty || 'medium'
      );
      bot.health = hacker.health;
      bot.hand = [...(hacker.hand || [])];
      bot.isAlive = hacker.isAlive;
      return bot;
    }
  });

  return {
    ...state,
    companies: copiedCompanies,
    hackers: copiedHackers,
    attackDeck: [...(state.attackDeck || [])],
    defenseDeck: [...(state.defenseDeck || [])],
    attackDiscardPile: [...(state.attackDiscardPile || [])],
    defenseDiscardPile: [...(state.defenseDiscardPile || [])]
  };
};

// ============================================================
// ОСНОВНОЙ КОМПОНЕНТ
// ============================================================
export function GameBoard({ user, onLogout, onShowProfile, theme, toggleTheme }) {
  // ===== СОСТОЯНИЯ ИГРЫ =====
  const [gameState, setGameState] = useState(null);
  const [selectedAttackCard, setSelectedAttackCard] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedDefenseCard, setSelectedDefenseCard] = useState(null);
  const [message, setMessage] = useState('');
  const [gameLog, setGameLog] = useState([]);
  const [choosingCharacteristic, setChoosingCharacteristic] = useState(null);
  const [roleSelection, setRoleSelection] = useState(null);
  const [gameMode, setGameMode] = useState('normal');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasActedThisTurn, setHasActedThisTurn] = useState(false);
  const processingRef = useRef(false);
  const timeoutRef = useRef(null);

  // ===== ПРИНУДИТЕЛЬНОЕ ОБНОВЛЕНИЕ СТАТИСТИКИ =====
  const [, forceUpdate] = useState({});

  // ===== СОСТОЯНИЯ СТАТИСТИКИ =====
  const { stats, addGame, clearStats } = useGameStats();
  const [showStats, setShowStats] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [currentGameData, setCurrentGameData] = useState({
    damageDealt: 0,
    damageTaken: 0,
    cardsUsed: 0,
    defensesUsed: 0,
    rounds: 0
  });
  const [isGameFinished, setIsGameFinished] = useState(false);

  // ============================================================
  // ФУНКЦИЯ ДЛЯ ПРИНУДИТЕЛЬНОГО ОБНОВЛЕНИЯ СТАТИСТИКИ
  // ============================================================
  const refreshStats = useCallback(() => {
    forceUpdate({});
  }, []);

  // ============================================================
  // СИНХРОНИЗАЦИЯ ТЕМЫ
  // ============================================================

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cyberGameTheme', theme);
  }, [theme]);

  useEffect(() => {
    const handleThemeChange = (e) => {
      if (e.detail && e.detail.theme) {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme !== e.detail.theme) {
          document.documentElement.setAttribute('data-theme', e.detail.theme);
          localStorage.setItem('cyberGameTheme', e.detail.theme);
        }
      }
    };
    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, []);

  // ============================================================
  // АВТОМАТИЧЕСКИЙ ВОЗВРАТ НА ГЛАВНЫЙ ЭКРАН
  // ============================================================
  useEffect(() => {
    if (gameState?.gameOver) {
      const timer = setTimeout(() => {
        setRoleSelection(null);
        setGameState(null);
        setGameLog([]);
        setSelectedAttackCard(null);
        setSelectedCompany(null);
        setSelectedDefenseCard(null);
        setCurrentGameData({
          damageDealt: 0,
          damageTaken: 0,
          cardsUsed: 0,
          defensesUsed: 0,
          rounds: 0
        });
        setIsGameFinished(false);
        setHasActedThisTurn(false);
        processingRef.current = false;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        refreshStats();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [gameState?.gameOver, refreshStats]);

  // ============================================================
  // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
  // ============================================================

  const addLogMessage = useCallback((msg) => {
    setGameLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 30));
  }, []);

  const getCurrentPlayer = (state) => {
    if (!state) return null;
    const allPlayers = [...state.hackers, ...state.companies];
    const alivePlayers = allPlayers.filter(p => p.isAlive !== false && p.health > 0);
    if (alivePlayers.length === 0) return null;
    const index = state.currentPlayerIndex % alivePlayers.length;
    return alivePlayers[index];
  };

  // ============================================================
  // ФУНКЦИЯ ВЫХОДА ИЗ ИГРЫ
  // ============================================================
  const handleExitGame = () => {
    if (!gameState) {
      setRoleSelection(null);
      setGameState(null);
      setGameLog([]);
      return;
    }

    if (gameState.gameOver) {
      setRoleSelection(null);
      setGameState(null);
      setGameLog([]);
      setSelectedAttackCard(null);
      setSelectedCompany(null);
      setSelectedDefenseCard(null);
      setMessage('Вы вышли из игры');
      setCurrentGameData({
        damageDealt: 0,
        damageTaken: 0,
        cardsUsed: 0,
        defensesUsed: 0,
        rounds: 0
      });
      setIsGameFinished(false);
      setHasActedThisTurn(false);
      refreshStats();
      return;
    }

    if (window.confirm('Вы уверены, что хотите выйти из игры? Прогресс будет потерян.')) {
      addGame({
        role: roleSelection,
        won: false,
        damageDealt: currentGameData.damageDealt,
        damageTaken: currentGameData.damageTaken,
        cardsUsed: currentGameData.cardsUsed,
        defensesUsed: currentGameData.defensesUsed,
        rounds: gameState.currentTurn + 1,
        opponent: 'Боты',
        mode: gameMode
      });
      refreshStats();

      setRoleSelection(null);
      setGameState(null);
      setGameLog([]);
      setSelectedAttackCard(null);
      setSelectedCompany(null);
      setSelectedDefenseCard(null);
      setMessage('Вы вышли из игры');
      setCurrentGameData({
        damageDealt: 0,
        damageTaken: 0,
        cardsUsed: 0,
        defensesUsed: 0,
        rounds: 0
      });
      setIsGameFinished(false);
      setHasActedThisTurn(false);
    }
  };

  // ============================================================
  // ПРОВЕРКА ОКОНЧАНИЯ ИГРЫ
  // ============================================================
  const checkGameOver = useCallback((state) => {
    const newState = { ...state };

    // Удаляем мёртвых игроков
    newState.hackers = newState.hackers.filter(h => h.isAlive !== false && h.health > 0);
    newState.companies = newState.companies.filter(c => c.isAlive !== false && c.health > 0);

    // Проверяем, жив ли игрок-человек
    const humanPlayer = newState.hackers.find(h => h.isHuman) || newState.companies.find(c => c.isHuman);
    
    if (!humanPlayer) {
      newState.gameOver = true;
      const isHackerRole = roleSelection === 'hacker';
      newState.winner = isHackerRole ? 'companies' : 'hackers';
      
      if (!newState.gameOverAdded) {
        newState.gameOverAdded = true;
        addLogMessage(`💀 ${roleSelection === 'hacker' ? 'Хакер' : 'Компания'} погиб! Игра окончена.`);
        addGame({
          role: roleSelection,
          won: false,
          damageDealt: currentGameData.damageDealt,
          damageTaken: currentGameData.damageTaken,
          cardsUsed: currentGameData.cardsUsed,
          defensesUsed: currentGameData.defensesUsed,
          rounds: newState.currentTurn + 1,
          opponent: 'Боты',
          mode: gameMode
        });
        refreshStats();
        setIsGameFinished(true);
      }
      return newState;
    }

    const aliveHackers = newState.hackers.filter(h => h.isAlive !== false && h.health > 0);
    const aliveCompanies = newState.companies.filter(c => c.isAlive !== false && c.health > 0);

    // Все хакеры умерли
    if (aliveHackers.length === 0) {
      newState.gameOver = true;
      newState.winner = 'companies';
      addLogMessage('🏆 КОМПАНИИ ПОБЕДИЛИ! Все хакеры уничтожены.');

      if (!newState.gameOverAdded) {
        newState.gameOverAdded = true;
        const isHacker = roleSelection === 'hacker';
        addGame({
          role: roleSelection,
          won: isHacker ? false : true,
          damageDealt: currentGameData.damageDealt,
          damageTaken: currentGameData.damageTaken,
          cardsUsed: currentGameData.cardsUsed,
          defensesUsed: currentGameData.defensesUsed,
          rounds: newState.currentTurn + 1,
          opponent: 'Боты',
          mode: gameMode
        });
        refreshStats();
        setIsGameFinished(true);
      }
      return newState;
    }

    // Все компании умерли
    if (aliveCompanies.length === 0) {
      newState.gameOver = true;
      newState.winner = 'hackers';
      addLogMessage('🏆 ХАКЕРЫ ПОБЕДИЛИ! Все компании уничтожены.');

      if (!newState.gameOverAdded) {
        newState.gameOverAdded = true;
        const isHacker = roleSelection === 'hacker';
        addGame({
          role: roleSelection,
          won: isHacker ? true : false,
          damageDealt: currentGameData.damageDealt,
          damageTaken: currentGameData.damageTaken,
          cardsUsed: currentGameData.cardsUsed,
          defensesUsed: currentGameData.defensesUsed,
          rounds: newState.currentTurn + 1,
          opponent: 'Боты',
          mode: gameMode
        });
        refreshStats();
        setIsGameFinished(true);
      }
      return newState;
    }

    // Проверяем, может ли игрок-человек сделать ход
    if (!canPlayerActCheck(newState, humanPlayer)) {
      newState.gameOver = true;
      const isHacker = humanPlayer.role === 'hacker';
      newState.winner = isHacker ? 'companies' : 'hackers';
      addLogMessage(`⚠️ ${humanPlayer.name} не может сделать ход! (Нет карт или целей)`);
      
      if (!newState.gameOverAdded) {
        newState.gameOverAdded = true;
        addGame({
          role: roleSelection,
          won: false,
          damageDealt: currentGameData.damageDealt,
          damageTaken: currentGameData.damageTaken,
          cardsUsed: currentGameData.cardsUsed,
          defensesUsed: currentGameData.defensesUsed,
          rounds: newState.currentTurn + 1,
          opponent: 'Боты',
          mode: gameMode
        });
        refreshStats();
        setIsGameFinished(true);
      }
      return newState;
    }

    return newState;
  }, [addLogMessage, roleSelection, addGame, currentGameData, gameMode, refreshStats]);

  // ============================================================
  // ВЫПОЛНЕНИЕ ХОДА БОТА
  // ============================================================

  const executeBotTurn = useCallback(async (state) => {
    if (processingRef.current) return state;
    processingRef.current = true;
    setIsProcessing(true);

    await new Promise(resolve => {
      timeoutRef.current = setTimeout(resolve, 800);
    });

    let newState = deepCopyGameState(state);
    const currentPlayer = getCurrentPlayer(newState);

    if (!currentPlayer || currentPlayer.isHuman || newState.gameOver) {
      processingRef.current = false;
      setIsProcessing(false);
      return newState;
    }

    addLogMessage(`🤖 Ход: ${currentPlayer.name}`);

    // Если бот не может сделать ход — пропускаем
    if (!canPlayerActCheck(newState, currentPlayer)) {
      addLogMessage(`⚠️ ${currentPlayer.name} не может сделать ход! (Нет карт или целей) — ход пропущен.`);
      
      const totalPlayers = newState.hackers.length + newState.companies.length;
      if (totalPlayers > 0) {
        newState.currentPlayerIndex = (newState.currentPlayerIndex + 1) % totalPlayers;
        if (newState.currentPlayerIndex === 0) {
          newState.currentTurn++;
          addLogMessage(`--- РАУНД ${newState.currentTurn + 1} ---`);
        }
      }
      newState = checkGameOver(newState);
      
      processingRef.current = false;
      setIsProcessing(false);
      return newState;
    }

    try {
      if (currentPlayer.role === 'hacker') {
        const aliveCompanies = newState.companies.filter(c => c.isAlive !== false && c.health > 0);

        if (aliveCompanies.length === 0) {
          newState.gameOver = true;
          newState.winner = 'companies';
          addLogMessage('🏆 КОМПАНИИ ПОБЕДИЛИ! Все компании уничтожены.');
          processingRef.current = false;
          setIsProcessing(false);
          return newState;
        }

        if (currentPlayer.chooseTarget) {
          const targetCompany = currentPlayer.chooseTarget(aliveCompanies);

          if (targetCompany && currentPlayer.chooseAttackCard) {
            const decision = currentPlayer.chooseAttackCard(targetCompany);

            if (decision) {
              if (decision.action === 'discard') {
                const cardIndex = currentPlayer.hand.findIndex(c => c.id === decision.card.id);
                if (cardIndex !== -1) {
                  const discarded = currentPlayer.hand[cardIndex];
                  currentPlayer.hand.splice(cardIndex, 1);
                  const result = discardAndDraw(newState, 'hacker', currentPlayer.id, discarded.id);
                  newState = result.gameState;
                  addLogMessage(`🤖 ${currentPlayer.name} сбросил карту ${discarded.name}`);
                }
              } else {
                let selectedChar = null;

                if (decision.card.type === 'choose' && targetCompany.characteristics) {
                  for (const [char, value] of Object.entries(targetCompany.characteristics)) {
                    const hasDefense = checkDefense(targetCompany, char);
                    if (value === 'low' && !hasDefense) {
                      selectedChar = char;
                      break;
                    }
                  }
                  if (!selectedChar) {
                    selectedChar = Object.keys(targetCompany.characteristics)[0];
                  }
                }

                const result = executeAttack(newState, currentPlayer.id, targetCompany.id, decision.card, selectedChar);
                newState = result.gameState;

                if (result.success) {
                  setCurrentGameData(prev => ({
                    ...prev,
                    damageDealt: prev.damageDealt + (result.damage || 0),
                    cardsUsed: prev.cardsUsed + 1
                  }));
                  addLogMessage(`🤖 ${currentPlayer.name} атакует ${targetCompany.name}: ${result.message} (урон: ${result.damage})`);
                } else {
                  addLogMessage(`🤖 ${currentPlayer.name} атакует ${targetCompany.name}: ${result.message}`);
                }
              }
            } else {
              addLogMessage(`⚠️ ${currentPlayer.name} не может выбрать карту! Ход пропущен.`);
            }
          } else {
            addLogMessage(`⚠️ ${currentPlayer.name} не может выбрать цель! Ход пропущен.`);
          }
        }
      } else if (currentPlayer.role === 'company') {
        const company = newState.companies.find(c => c.id === currentPlayer.id);

        if (company && company.temporaryDefenses && company.temporaryDefenses.length > 0) {
          const clearedNames = company.temporaryDefenses.map(d => d.name).join(', ');
          company.temporaryDefenses = [];
          addLogMessage(`🏢 ${company.name}: сняты временные защиты: ${clearedNames}`);
        }

        if (currentPlayer.chooseDefenseCard) {
          const defenseCard = currentPlayer.chooseDefenseCard();

          if (defenseCard) {
            if (defenseCard.action === 'discard') {
              const cardIndex = currentPlayer.hand.findIndex(c => c.id === defenseCard.card.id);
              if (cardIndex !== -1) {
                const discarded = currentPlayer.hand[cardIndex];
                currentPlayer.hand.splice(cardIndex, 1);
                const result = discardAndDraw(newState, 'company', currentPlayer.id, discarded.id);
                newState = result.gameState;
                addLogMessage(`🏢 ${currentPlayer.name} сбросил карту ${discarded.name}`);
              }
            } else if (defenseCard) {
              const result = useDefenseCard(newState, currentPlayer.id, defenseCard);
              newState = result.gameState;
              if (result.success) {
                setCurrentGameData(prev => ({
                  ...prev,
                  defensesUsed: prev.defensesUsed + 1
                }));
                addLogMessage(`🏢 ${currentPlayer.name} активировал защиту: ${defenseCard.name}`);
              }
            }
          } else {
            addLogMessage(`⚠️ ${currentPlayer.name} не может выбрать защиту! Ход пропущен.`);
          }
        }
      }
    } catch (error) {
      console.error('Bot turn error:', error);
      addLogMessage(`⚠️ Ошибка при ходе бота ${currentPlayer.name}`);
    }

    const aliveCompanies = newState.companies.filter(c => c.isAlive !== false && c.health > 0);
    const aliveHackers = newState.hackers.filter(h => h.isAlive !== false && h.health > 0);

    if (aliveCompanies.length === 0) {
      newState.gameOver = true;
      newState.winner = 'hackers';
      addLogMessage('🏆 ХАКЕРЫ ПОБЕДИЛИ! Все компании уничтожены.');
      processingRef.current = false;
      setIsProcessing(false);
      return newState;
    }

    if (aliveHackers.length === 0) {
      newState.gameOver = true;
      newState.winner = 'companies';
      addLogMessage('🏆 КОМПАНИИ ПОБЕДИЛИ! Все хакеры уничтожены.');
      processingRef.current = false;
      setIsProcessing(false);
      return newState;
    }

    const totalPlayers = newState.hackers.length + newState.companies.length;
    if (totalPlayers > 0) {
      newState.currentPlayerIndex = (newState.currentPlayerIndex + 1) % totalPlayers;
      if (newState.currentPlayerIndex === 0) {
        newState.currentTurn++;
        addLogMessage(`--- РАУНД ${newState.currentTurn + 1} ---`);
      }
    }

    newState = checkGameOver(newState);

    processingRef.current = false;
    setIsProcessing(false);
    return newState;
  }, [addLogMessage, checkGameOver]);

  // ============================================================
  // ЭФФЕКТЫ
  // ============================================================

  useEffect(() => {
    if (!gameState || gameState.gameOver || isProcessing) return;

    const currentPlayer = getCurrentPlayer(gameState);
    if (currentPlayer && !currentPlayer.isHuman) {
      executeBotTurn(gameState).then(newState => {
        setGameState(newState);
      });
    }
  }, [gameState, isProcessing, executeBotTurn]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // ============================================================
  // ОБРАБОТЧИКИ ДЕЙСТВИЙ
  // ============================================================

  const startNewGame = (role, mode = 'normal') => {
    const newGame = initializeGameWithBots(role, 4, 2, mode);

    if (role === 'hacker') {
      newGame.companies.forEach(company => {
        company.hideCharacteristics = true;
        company.revealedCharacteristics = [];
      });
    } else {
      newGame.companies.forEach(company => {
        company.hideCharacteristics = false;
      });
    }

    setCurrentGameData({
      damageDealt: 0,
      damageTaken: 0,
      cardsUsed: 0,
      defensesUsed: 0,
      rounds: 0
    });
    setIsGameFinished(false);
    setHasActedThisTurn(false);

    setGameState(newGame);
    setRoleSelection(role);
    setGameMode(mode);
    setSelectedAttackCard(null);
    setSelectedCompany(null);
    setSelectedDefenseCard(null);
    setMessage(`Игра началась! Вы играете за ${role === 'hacker' ? 'Хакера' : 'Компанию'} (${mode === 'fast' ? 'Быстрый режим' : 'Обычный режим'})`);
    addLogMessage(`Игра началась! Роль: ${role === 'hacker' ? 'Хакер' : 'Компания'}, Режим: ${mode === 'fast' ? 'Быстрый' : 'Обычный'}`);
    addLogMessage(`--- РАУНД 1 ---`);
    refreshStats();
  };

  const endTurn = () => {
    if (!gameState || gameState.gameOver || isProcessing) return;

    const currentPlayer = getCurrentPlayer(gameState);
    if (!currentPlayer || !currentPlayer.isHuman) {
      setMessage('Сейчас не ваш ход!');
      return;
    }

    // Сбрасываем флаг действия в этом ходу
    setHasActedThisTurn(false);

    const newState = deepCopyGameState(gameState);

    if (currentPlayer.role === 'company') {
      const company = newState.companies.find(c => c.id === currentPlayer.id);
      if (company && company.temporaryDefenses && company.temporaryDefenses.length > 0) {
        const clearedNames = company.temporaryDefenses.map(d => d.name).join(', ');
        company.temporaryDefenses = [];
        addLogMessage(`🏢 ${company.name}: сняты временные защиты: ${clearedNames}`);
      }
    }

    // Удаляем мёртвых игроков
    newState.hackers = newState.hackers.filter(h => h.isAlive !== false && h.health > 0);
    newState.companies = newState.companies.filter(c => c.isAlive !== false && c.health > 0);

    // Проверяем, жив ли игрок-человек
    const humanPlayer = newState.hackers.find(h => h.isHuman) || newState.companies.find(c => c.isHuman);
    if (!humanPlayer) {
      newState.gameOver = true;
      const isHacker = roleSelection === 'hacker';
      newState.winner = isHacker ? 'companies' : 'hackers';
      addLogMessage(`💀 Игрок погиб! Игра окончена.`);
      setGameState(newState);
      setMessage('Игра окончена! Вы погибли.');
      refreshStats();
      return;
    }

    const aliveCompanies = newState.companies.filter(c => c.isAlive !== false && c.health > 0);
    const aliveHackers = newState.hackers.filter(h => h.isAlive !== false && h.health > 0);

    if (aliveCompanies.length === 0) {
      newState.gameOver = true;
      newState.winner = 'hackers';
      addLogMessage('🏆 ХАКЕРЫ ПОБЕДИЛИ! Все компании уничтожены.');
      setGameState(newState);
      setMessage('Игра окончена! Хакеры победили!');
      refreshStats();
      return;
    }

    if (aliveHackers.length === 0) {
      newState.gameOver = true;
      newState.winner = 'companies';
      addLogMessage('🏆 КОМПАНИИ ПОБЕДИЛИ! Все хакеры уничтожены.');
      setGameState(newState);
      setMessage('Игра окончена! Компании победили!');
      refreshStats();
      return;
    }

    const totalPlayers = newState.hackers.length + newState.companies.length;
    if (totalPlayers > 0) {
      newState.currentPlayerIndex = (newState.currentPlayerIndex + 1) % totalPlayers;
      if (newState.currentPlayerIndex === 0) {
        newState.currentTurn++;
        addLogMessage(`--- РАУНД ${newState.currentTurn + 1} ---`);
      }
    }

    setGameState(newState);
    setSelectedAttackCard(null);
    setSelectedCompany(null);
    setSelectedDefenseCard(null);
    setMessage('Ход передан');
    addLogMessage('Ход передан следующему игроку');
  };

  const handleAttack = () => {
    if (!gameState || isProcessing) return;

    const currentPlayer = getCurrentPlayer(gameState);
    if (!currentPlayer || !currentPlayer.isHuman) {
      setMessage('Сейчас не ваш ход!');
      return;
    }

    // ===== ПРОВЕРКА: УЖЕ ИСПОЛЬЗОВАЛ КАРТУ В ЭТОМ ХОДУ =====
    if (hasActedThisTurn) {
      setMessage('⚠️ Вы уже использовали карту в этом ходу!');
      return;
    }

    if (!selectedAttackCard || !selectedCompany) {
      setMessage('Выберите карту атаки и компанию');
      return;
    }

    if (selectedAttackCard.type === 'choose') {
      setChoosingCharacteristic(selectedAttackCard);
      return;
    }

    let newState = deepCopyGameState(gameState);
    const result = executeAttack(newState, currentPlayer.id, selectedCompany.id, selectedAttackCard);
    newState = result.gameState;

    if (result.success) {
      setCurrentGameData(prev => ({
        ...prev,
        damageDealt: prev.damageDealt + (result.damage || 0),
        cardsUsed: prev.cardsUsed + 1
      }));
      addLogMessage(`⚔️ ${selectedAttackCard.name} -> ${selectedCompany.name}: ${result.message} (урон: ${result.damage})`);
    } else {
      addLogMessage(`❌ ${selectedAttackCard.name} -> ${selectedCompany.name}: ${result.message}`);
    }

    // ===== БЛОКИРУЕМ ДАЛЬНЕЙШИЙ ВЫБОР =====
    setHasActedThisTurn(true);
    const afterAttackState = checkGameOver(newState);
    setGameState(afterAttackState);
    setMessage(result.message);
    setSelectedAttackCard(null);
    setSelectedCompany(null);
    setChoosingCharacteristic(null);
  };

  const handleAttackWithChar = (characteristic) => {
    if (!gameState || !choosingCharacteristic || !selectedCompany) return;

    const currentPlayer = getCurrentPlayer(gameState);
    if (!currentPlayer || !currentPlayer.isHuman) return;

    // ===== ПРОВЕРКА: УЖЕ ИСПОЛЬЗОВАЛ КАРТУ В ЭТОМ ХОДУ =====
    if (hasActedThisTurn) {
      setMessage('⚠️ Вы уже использовали карту в этом ходу!');
      return;
    }

    let newState = deepCopyGameState(gameState);
    const result = executeAttack(newState, currentPlayer.id, selectedCompany.id, choosingCharacteristic, characteristic);
    newState = result.gameState;

    if (result.success) {
      setCurrentGameData(prev => ({
        ...prev,
        damageDealt: prev.damageDealt + (result.damage || 0),
        cardsUsed: prev.cardsUsed + 1
      }));
      addLogMessage(`⚔️ ${choosingCharacteristic.name} (${characteristicNames[characteristic]}) -> ${selectedCompany.name}: ${result.message}`);
    } else {
      addLogMessage(`❌ ${choosingCharacteristic.name} -> ${selectedCompany.name}: ${result.message}`);
    }

    // ===== БЛОКИРУЕМ ДАЛЬНЕЙШИЙ ВЫБОР =====
    setHasActedThisTurn(true);
    const afterAttackState = checkGameOver(newState);
    setGameState(afterAttackState);
    setMessage(result.message);
    setSelectedAttackCard(null);
    setSelectedCompany(null);
    setChoosingCharacteristic(null);
  };

  const handleUseDefense = () => {
    if (!gameState || isProcessing) return;

    const currentPlayer = getCurrentPlayer(gameState);
    if (!currentPlayer || !currentPlayer.isHuman) {
      setMessage('Сейчас не ваш ход!');
      return;
    }

    // ===== ПРОВЕРКА: УЖЕ ИСПОЛЬЗОВАЛ КАРТУ В ЭТОМ ХОДУ =====
    if (hasActedThisTurn) {
      setMessage('⚠️ Вы уже использовали карту в этом ходу!');
      return;
    }

    if (!selectedDefenseCard) {
      setMessage('Выберите карту защиты');
      return;
    }

    const company = gameState.companies.find(c => c.id === currentPlayer.id);
    if (!company) {
      setMessage('Компания не найдена');
      return;
    }

    let newState = deepCopyGameState(gameState);
    const result = useDefenseCard(newState, company.id, selectedDefenseCard);
    newState = result.gameState;

    if (result.success) {
      setCurrentGameData(prev => ({
        ...prev,
        defensesUsed: prev.defensesUsed + 1
      }));
      addLogMessage(`🛡️ ${selectedDefenseCard.name} активирована для ${company.name}`);
    }

    // ===== БЛОКИРУЕМ ДАЛЬНЕЙШИЙ ВЫБОР =====
    setHasActedThisTurn(true);
    setGameState(checkGameOver(newState));
    setMessage(result.message);
    setSelectedDefenseCard(null);
  };

  const handleDiscardCard = (card) => {
    if (!gameState || isProcessing) return;

    const currentPlayer = getCurrentPlayer(gameState);
    if (!currentPlayer || !currentPlayer.isHuman) {
      setMessage('Сейчас не ваш ход!');
      return;
    }

    // ===== ПРОВЕРКА: УЖЕ ИСПОЛЬЗОВАЛ КАРТУ В ЭТОМ ХОДУ =====
    if (hasActedThisTurn) {
      setMessage('⚠️ Вы уже использовали карту в этом ходу!');
      return;
    }

    if (roleSelection === 'company') {
      const charValue = currentPlayer.characteristics?.[card.characteristic];
      if (charValue === 'high') {
        let newState = deepCopyGameState(gameState);
        const result = discardAndDraw(newState, 'company', currentPlayer.id, card.id);
        newState = result.gameState;
        setGameState(newState);
        // Бесплатный сброс НЕ блокирует ход
        addLogMessage(`🔄 Карта ${card.name} сброшена бесплатно (высокая характеристика)`);
        setMessage('Карта сброшена бесплатно');
        return;
      }
    }

    let newState = deepCopyGameState(gameState);
    const playerType = roleSelection === 'hacker' ? 'hacker' : 'company';
    const result = discardAndDraw(newState, playerType, currentPlayer.id, card.id);
    newState = result.gameState;

    if (result.success) {
      setGameState(newState);
      // ===== БЛОКИРУЕМ ДАЛЬНЕЙШИЙ ВЫБОР =====
      setHasActedThisTurn(true);
      addLogMessage(`🔄 ${card.name} сброшена и заменена`);
      setMessage(result.message);
    } else {
      setMessage(result.message);
    }
  };

  // ============================================================
  // РЕНДЕРИНГ - ЭКРАН ВЫБОРА РОЛИ
  // ============================================================

  if (!roleSelection) {
    return (
      <div className="role-select" data-theme={theme}>
        <h1>🛡️ Cyber Conflict</h1>
        <p className="subtitle">Выберите сторону в кибервойне</p>

        <div className="role-select-container">
          <div className="role-card-wrapper">
            <div className="role-card role-hacker-card">
              <div className="role-card-header">🕵️</div>
              <h2>Хакер</h2>
              <p className="role-desc">Вы + 1 бот против 4 компаний</p>
              <div className="role-rules">
                <strong>Ваши задачи:</strong>
                <ul>
                  <li>Атакуйте компании, находя их слабые места</li>
                  <li>Используйте карты атаки для нанесения урона</li>
                  <li>Доведите здоровье всех компаний до 0</li>
                  <li>Атака на ВЫСОКУЮ характеристику стоит вам 1 HP</li>
                </ul>
              </div>
              <div className="role-modes">
                <button className="mode-btn mode-normal" onClick={() => startNewGame('hacker', 'normal')}>
                  ⚡ Обычный режим
                </button>
                <button className="mode-btn mode-fast" onClick={() => startNewGame('hacker', 'fast')}>
                  🚀 Быстрый режим
                </button>
              </div>
            </div>
          </div>

          <div className="role-card-wrapper">
            <div className="role-card role-company-card">
              <div className="role-card-header">🏢</div>
              <h2>Компания</h2>
              <p className="role-desc">Вы + 3 бота против 2 хакеров</p>
              <div className="role-rules">
                <strong>Ваши задачи:</strong>
                <ul>
                  <li>Защищайте свои слабые характеристики</li>
                  <li>Используйте карты защиты для укрепления</li>
                  <li>Не дайте хакерам снизить ваше здоровье до 0</li>
                  <li>Сбрасывайте карты на ВЫСОКИХ характеристиках бесплатно</li>
                </ul>
              </div>
              <div className="role-modes">
                <button className="mode-btn mode-normal" onClick={() => startNewGame('company', 'normal')}>
                  ⚡ Обычный режим
                </button>
                <button className="mode-btn mode-fast" onClick={() => startNewGame('company', 'fast')}>
                  🚀 Быстрый режим
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="rules-section">
          <h3>📖 Правила игры</h3>
          <div className="rules-grid">
            <div className="rules-column">
              <h4>🎯 Цель игры</h4>
              <p><strong>Хакеры</strong> — уничтожить все компании, снизив их здоровье до 0</p>
              <p><strong>Компании</strong> — защититься и не дать хакерам победить</p>
            </div>
            <div className="rules-column">
              <h4>⚔️ Атака</h4>
              <p>• Атака на <strong>НИЗКУЮ</strong> характеристику — ✅ Успех (урон 1-2)</p>
              <p>• Атака на <strong>ВЫСОКУЮ</strong> характеристику — ❌ Провал (хакер теряет 1 HP)</p>
              <p>• Атака на <strong>защищённую</strong> характеристику — ❌ Провал (защита снимается)</p>
            </div>
            <div className="rules-column">
              <h4>🛡️ Защита</h4>
              <p>• <strong>Временная</strong> защита — действует 1 ход</p>
              <p>• <strong>Постоянная</strong> защита — действует до первой атаки</p>
              <p>• Компании с <strong>ВЫСОКОЙ</strong> характеристикой сбрасывают карты <strong>бесплатно</strong></p>
            </div>
            <div className="rules-column">
              <h4>🔍 Скрытые характеристики</h4>
              <p>• Для хакера характеристики компаний <strong>скрыты</strong> 🔒</p>
              <p>• При атаке или защите характеристика <strong>раскрывается</strong></p>
              <p>• Боты видят все характеристики (для баланса)</p>
            </div>
          </div>
          <div className="rules-modes">
            <h4>🎮 Режимы игры</h4>
            <p><strong>⚡ Обычный режим</strong> — полная игра с 10 HP у всех и 3 картами в руке</p>
            <p><strong>🚀 Быстрый режим</strong> — ускоренная игра с 6 HP и 2 картами в руке</p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // ЭКРАН ОКОНЧАНИЯ ИГРЫ
  // ============================================================
  if (gameState?.gameOver) {
    let reason = '';
    let emoji = '';
    let color = '';

    const humanPlayer = gameState.hackers.find(h => h.isHuman) || gameState.companies.find(c => c.isHuman);
    
    if (humanPlayer && (humanPlayer.health <= 0 || humanPlayer.isAlive === false)) {
      reason = `💀 Ваш персонаж погиб!`;
      emoji = '💀';
      color = '#e74c3c';
    } else if (gameState.winner === 'hackers') {
      reason = `👾 Все компании уничтожены!`;
      emoji = '👾';
      color = '#e74c3c';
    } else if (gameState.winner === 'companies') {
      reason = `🏢 Все хакеры уничтожены!`;
      emoji = '🏢';
      color = '#2ecc71';
    } else {
      reason = `Игра завершена`;
      emoji = '🏁';
      color = '#6fbda8';
    }

    const lastLog = gameLog.length > 0 ? gameLog[0] : '';
    if (lastLog.includes('не может сделать ход') && !reason.includes('погиб')) {
      reason = `⚠️ Вы не можете сделать ход (нет карт или целей)`;
      emoji = '⚠️';
      color = '#f39c12';
    }

    const isPlayerHacker = roleSelection === 'hacker';
    const playerWon = (gameState.winner === 'hackers' && isPlayerHacker) || 
                      (gameState.winner === 'companies' && !isPlayerHacker);

    const resultText = playerWon ? 'ПОБЕДА! 🎉' : 'ПОРАЖЕНИЕ... 😔';
    const resultColor = playerWon ? '#27ae60' : '#e74c3c';

    return (
      <div className="game-over" data-theme={theme}>
        <div className="game-over-content">
          <div className="game-over-icon">{emoji}</div>
          <h1>🏁 Игра окончена</h1>
          <div className="game-over-result" style={{ color: resultColor }}>
            {resultText}
          </div>
          <div className="game-over-reason">
            {reason}
          </div>
          <div className="game-over-winner" style={{ color: gameState.winner === 'hackers' ? '#e74c3c' : '#2ecc71' }}>
            {gameState.winner === 'hackers' ? '👾 Хакеры победили!' : '🏢 Компании победили!'}
          </div>

          <div className="game-over-stats">
            <div className="stat-item">
              <div className="stat-value">{gameState.currentTurn + 1}</div>
              <div className="stat-label">Раундов</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{currentGameData.damageDealt}</div>
              <div className="stat-label">Нанесено урона</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{currentGameData.cardsUsed}</div>
              <div className="stat-label">Карт использовано</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{gameMode === 'fast' ? '🚀' : '⚡'}</div>
              <div className="stat-label">{gameMode === 'fast' ? 'Быстрый режим' : 'Обычный режим'}</div>
            </div>
          </div>

          <div className="game-over-buttons">
            <button className="btn-new-game" onClick={() => {
              setRoleSelection(null);
              setGameState(null);
              setGameLog([]);
              setSelectedAttackCard(null);
              setSelectedCompany(null);
              setSelectedDefenseCard(null);
              setCurrentGameData({
                damageDealt: 0,
                damageTaken: 0,
                cardsUsed: 0,
                defensesUsed: 0,
                rounds: 0
              });
              setIsGameFinished(false);
              setHasActedThisTurn(false);
              processingRef.current = false;
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
              refreshStats();
            }}>
              🔄 Новая игра
            </button>
            <button className="btn-stats" onClick={() => setShowStats(true)}>
              📊 Статистика
            </button>
          </div>

          <p className="return-timer">
            ⏳ Возврат на главный экран через 5 секунд...
          </p>
        </div>
      </div>
    );
  }

  const currentPlayer = getCurrentPlayer(gameState);
  const isHumanTurn = currentPlayer?.isHuman && !isProcessing && !gameState?.gameOver;

  // ===== ОСНОВНОЙ ЭКРАН ИГРЫ =====
  return (
    <div className="container" data-theme={theme}>
      <div className="top-panel">
        <div className="top-panel-left">
          <div className="round">🔁 РАУНД {gameState.currentTurn + 1}</div>
          <span className="mode-badge">{gameMode === 'fast' ? '🚀 Быстрый' : '⚡ Обычный'}</span>
          {user && <span className="user-name">👤 {user.displayName}</span>}
        </div>
        <div className="top-panel-center">
          <div className="current-player">
            👤 {currentPlayer?.name || 'Неизвестно'}
            {isProcessing && <span className="bot-turn">🤖 Ход бота...</span>}
            {isHumanTurn && <span className="human-turn">⭐ ВАШ ХОД!</span>}
          </div>
        </div>
        <div className="top-panel-right">
          <button className="top-btn profile-btn" onClick={onShowProfile} title="Профиль">👤</button>
          <button className="top-btn stats-btn" onClick={() => setShowStats(true)} title="Статистика">📊</button>
          <button className="top-btn history-btn" onClick={() => setShowHistory(true)} title="История">📜</button>
          <button className="top-btn exit-btn" onClick={handleExitGame} title="Выйти из игры">🚪</button>
          <button className="top-btn logout-btn" onClick={onLogout} title="Выйти из аккаунта">🔓</button>
        </div>
      </div>

      <div className="message-bar">
        <strong>{message || (isHumanTurn ? '🎯 Ваш ход! Выберите действие' : (isProcessing ? '🤖 Ход бота...' : 'Ожидание...'))}</strong>
        {isHumanTurn && hasActedThisTurn && (
          <span style={{ color: '#f39c12', marginLeft: '10px' }}>
            ⚠️ Вы уже использовали карту в этом ходу
          </span>
        )}
      </div>

      <h2 style={{ color: 'var(--text-white)', marginBottom: '15px', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
        🏢 КОМПАНИИ ({gameState.companies.length})
      </h2>
      <div className="companies-grid">
        {gameState.companies.map(company => (
          <div
            key={company.id}
            className={`company-card ${isHumanTurn && roleSelection === 'hacker' ? 'selectable' : ''} ${selectedCompany?.id === company.id ? 'selected' : ''}`}
            onClick={() => {
              if (isHumanTurn && roleSelection === 'hacker' && !selectedAttackCard) {
                setMessage('Сначала выберите карту атаки');
              } else if (isHumanTurn && roleSelection === 'hacker' && selectedAttackCard && !hasActedThisTurn) {
                setSelectedCompany(company);
              } else if (isHumanTurn && roleSelection === 'hacker' && hasActedThisTurn) {
                setMessage('⚠️ Вы уже использовали карту в этом ходу!');
              }
            }}
          >
            <Card card={company} type="company" />
            <div className="company-health">
              ❤️ Здоровье: <span className="health-bar">{company.health}</span>
            </div>
            <div className="company-defenses">
              <strong>🛡️ Защиты:</strong>
              {company.permanentDefenses?.length > 0 && (
                <div><span className="permanent">Постоянные:</span> {company.permanentDefenses.map(d => d.name).join(', ')}</div>
              )}
              {company.temporaryDefenses?.length > 0 && (
                <div><span className="temporary">Временные:</span> {company.temporaryDefenses.map(d => d.name).join(', ')}</div>
              )}
              {(!company.permanentDefenses?.length && !company.temporaryDefenses?.length) && (
                <div style={{ color: 'var(--text-muted)' }}>Нет активных защит</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ color: 'var(--text-white)', marginBottom: '15px', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
        👾 ХАКЕРЫ ({gameState.hackers.length})
      </h2>
      <div className="hackers-grid">
        {gameState.hackers.map(hacker => (
          <div
            key={hacker.id}
            className={`hacker-card ${currentPlayer?.id === hacker.id ? 'current' : ''} ${hacker.isHuman ? 'human' : ''}`}
          >
            <div className="hacker-name">{hacker.name} {hacker.isHuman && '(Вы)'}</div>
            <div>❤️ Здоровье: {hacker.health}</div>
            <div>📚 Карт: {hacker.hand?.length || 0}</div>
          </div>
        ))}
      </div>

      {isHumanTurn && (
        <>
          {roleSelection === 'hacker' && (
            <Hand
              cards={currentPlayer.hand}
              type="attack"
              title="🗡️ ВАШИ КАРТЫ АТАК"
              onCardClick={(card) => {
                if (hasActedThisTurn) {
                  setMessage('⚠️ Вы уже использовали карту в этом ходу!');
                  return;
                }
                if (selectedAttackCard?.id === card.id) {
                  setSelectedAttackCard(null);
                  setSelectedCompany(null);
                } else {
                  setSelectedAttackCard(card);
                  setSelectedCompany(null);
                  setMessage(`Выбрана карта: ${card.name}`);
                }
              }}
              selectedCardId={selectedAttackCard?.id}
              onDiscard={handleDiscardCard}
            />
          )}

          {roleSelection === 'company' && (
            <Hand
              cards={currentPlayer.hand}
              type="defense"
              title="🛡️ ВАШИ КАРТЫ ЗАЩИТЫ"
              onCardClick={(card) => {
                if (hasActedThisTurn) {
                  setMessage('⚠️ Вы уже использовали карту в этом ходу!');
                  return;
                }
                if (selectedDefenseCard?.id === card.id) {
                  setSelectedDefenseCard(null);
                } else {
                  setSelectedDefenseCard(card);
                  setMessage(`Выбрана карта: ${card.name}`);
                }
              }}
              selectedCardId={selectedDefenseCard?.id}
              onDiscard={handleDiscardCard}
              playerCharacteristics={currentPlayer.characteristics}
            />
          )}

          <div className="action-panel">
            <div className="actions-row">
              {roleSelection === 'hacker' && (
                <button
                  className="btn-attack"
                  onClick={handleAttack}
                  disabled={!selectedAttackCard || !selectedCompany || hasActedThisTurn}
                >
                  ⚔️ АТАКОВАТЬ
                </button>
              )}

              {roleSelection === 'company' && (
                <button
                  className="btn-defense"
                  onClick={handleUseDefense}
                  disabled={!selectedDefenseCard || hasActedThisTurn}
                >
                  🛡️ ЗАЩИТИТЬ
                </button>
              )}

              <button
                className="btn-clear"
                onClick={() => {
                  if (!hasActedThisTurn) {
                    setSelectedAttackCard(null);
                    setSelectedDefenseCard(null);
                    setSelectedCompany(null);
                    setMessage('Выбор очищен');
                  } else {
                    setMessage('⚠️ Вы уже использовали карту в этом ходу!');
                  }
                }}
              >
                🗑️ Очистить
              </button>
            </div>

            <button
              className="btn-end-turn"
              onClick={endTurn}
            >
              ⏭️ ЗАВЕРШИТЬ ХОД
            </button>
          </div>
        </>
      )}

      {isProcessing && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '12px',
          textAlign: 'center',
          border: '2px solid #6fbda8',
          color: 'var(--text-primary)'
        }}>
          <p>🤖 <strong>{currentPlayer?.name}</strong> выполняет ход...</p>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Пожалуйста, подождите</div>
        </div>
      )}

      <div className="log-container">
        <div className="log-title">📜 ЛОГ ИГРЫ</div>
        {gameLog.map((log, idx) => (
          <div key={idx} className="log-entry">
            <span className="time">[{new Date().toLocaleTimeString()}]</span> {log}
          </div>
        ))}
      </div>

      {choosingCharacteristic && (
        <div className="modal-overlay" data-theme={theme}>
          <div className="modal-content">
            <h3>Выберите характеристику для атаки</h3>
            {Object.entries(characteristicNames).map(([key, name]) => (
              <button key={key} className="modal-btn" onClick={() => handleAttackWithChar(key)}>
                {characteristicIcons[key] || '📊'} {name}
              </button>
            ))}
            <button className="modal-btn modal-btn-cancel" onClick={() => {
              setChoosingCharacteristic(null);
              setSelectedAttackCard(null);
            }}>
              Отмена
            </button>
          </div>
        </div>
      )}

      {showStats && (
        <Stats
          stats={stats}
          onClose={() => setShowStats(false)}
          onClear={() => {
            if (window.confirm('Вы уверены, что хотите очистить всю статистику?')) {
              clearStats();
              refreshStats();
            }
          }}
          theme={theme}
        />
      )}

      {showHistory && (
        <History
          history={stats.history}
          onClose={() => setShowHistory(false)}
          theme={theme}
        />
      )}
    </div>
  );
}