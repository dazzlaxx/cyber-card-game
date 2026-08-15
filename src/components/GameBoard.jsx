// ГЛАВНЫЙ КОМПОНЕНТ ИГРЫ

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
  checkDefense
} from '../game/gameLogic';
import { createHackerBot, createCompanyBot } from '../game/botLogic';
import { characteristicNames, characteristicIcons } from '../data/characteristics';
import { useGameStats } from '../hooks/useGameStats';

// ============================================================
// ФУНКЦИЯ ДЛЯ ГЛУБОКОГО КОПИРОВАНИЯ СОСТОЯНИЯ
// ============================================================
const deepCopyGameState = (state) => {
  if (!state) return null;

  // Копируем компании с восстановлением методов ботов
  const copiedCompanies = state.companies.map(company => {
    if (company.isHuman) {
      // Человек-компания - просто копируем
      return {
        ...company,
        hand: [...(company.hand || [])],
        permanentDefenses: [...(company.permanentDefenses || [])],
        temporaryDefenses: [...(company.temporaryDefenses || [])],
        revealedCharacteristics: [...(company.revealedCharacteristics || [])],
        hideCharacteristics: company.hideCharacteristics
      };
    } else {
      // Бот-компания - создаём заново через фабрику
      const bot = createCompanyBot(
        {
          id: company.id,
          name: company.name,
          characteristics: { ...company.characteristics }
        },
        company.difficulty || 'medium'
      );
      // Восстанавливаем состояние
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

  // Копируем хакеров с восстановлением методов ботов
  const copiedHackers = state.hackers.map(hacker => {
    if (hacker.isHuman) {
      // Человек-хакер - просто копируем
      return {
        ...hacker,
        hand: [...(hacker.hand || [])]
      };
    } else {
      // Бот-хакер - создаём заново через фабрику
      const botId = hacker.id.replace('hacker_bot_', '');
      const bot = createHackerBot(
        botId || '1',
        hacker.name,
        hacker.difficulty || 'medium'
      );
      // Восстанавливаем состояние
      bot.health = hacker.health;
      bot.hand = [...(hacker.hand || [])];
      bot.isAlive = hacker.isAlive;
      return bot;
    }
  });

  // Возвращаем новое состояние
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
export function GameBoard({ user, onLogout, onShowProfile }) {
  // ===== СОСТОЯНИЯ ИГРЫ =====
  const [gameState, setGameState] = useState(null);
  const [selectedAttackCard, setSelectedAttackCard] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedDefenseCard, setSelectedDefenseCard] = useState(null);
  const [message, setMessage] = useState('');
  const [gameLog, setGameLog] = useState([]);
  const [choosingCharacteristic, setChoosingCharacteristic] = useState(null);
  const [roleSelection, setRoleSelection] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);
  const timeoutRef = useRef(null);

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
      return;
    }

    // Спрашиваем подтверждение
    if (window.confirm('Вы уверены, что хотите выйти из игры? Прогресс будет потерян.')) {
      // Добавляем игру как поражение
      addGame({
        role: roleSelection,
        won: false,
        damageDealt: currentGameData.damageDealt,
        damageTaken: currentGameData.damageTaken,
        cardsUsed: currentGameData.cardsUsed,
        defensesUsed: currentGameData.defensesUsed,
        rounds: gameState.currentTurn + 1,
        opponent: 'Боты'
      });

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
    }
  };

  // ============================================================
  // ПРОВЕРКА ОКОНЧАНИЯ ИГРЫ С СОХРАНЕНИЕМ СТАТИСТИКИ
  // ============================================================
  const checkGameOver = useCallback((state) => {
    const newState = { ...state };

    if (newState.hackers.length === 0) {
      newState.gameOver = true;
      newState.winner = 'companies';
      addLogMessage('🏆 КОМПАНИИ ПОБЕДИЛИ! Все хакеры уничтожены.');

      if (roleSelection === 'hacker' && !newState.gameOverAdded) {
        newState.gameOverAdded = true;
        addGame({
          role: 'hacker',
          won: false,
          damageDealt: currentGameData.damageDealt,
          damageTaken: currentGameData.damageTaken,
          cardsUsed: currentGameData.cardsUsed,
          defensesUsed: currentGameData.defensesUsed,
          rounds: newState.currentTurn + 1,
          opponent: 'Боты'
        });
        setIsGameFinished(true);
      } else if (roleSelection === 'company' && !newState.gameOverAdded) {
        newState.gameOverAdded = true;
        addGame({
          role: 'company',
          won: true,
          damageDealt: currentGameData.damageDealt,
          damageTaken: currentGameData.damageTaken,
          cardsUsed: currentGameData.cardsUsed,
          defensesUsed: currentGameData.defensesUsed,
          rounds: newState.currentTurn + 1,
          opponent: 'Боты'
        });
        setIsGameFinished(true);
      }

    } else if (newState.companies.length === 0) {
      newState.gameOver = true;
      newState.winner = 'hackers';
      addLogMessage('🏆 ХАКЕРЫ ПОБЕДИЛИ! Все компании уничтожены.');

      if (roleSelection === 'hacker' && !newState.gameOverAdded) {
        newState.gameOverAdded = true;
        addGame({
          role: 'hacker',
          won: true,
          damageDealt: currentGameData.damageDealt,
          damageTaken: currentGameData.damageTaken,
          cardsUsed: currentGameData.cardsUsed,
          defensesUsed: currentGameData.defensesUsed,
          rounds: newState.currentTurn + 1,
          opponent: 'Боты'
        });
        setIsGameFinished(true);
      } else if (roleSelection === 'company' && !newState.gameOverAdded) {
        newState.gameOverAdded = true;
        addGame({
          role: 'company',
          won: false,
          damageDealt: currentGameData.damageDealt,
          damageTaken: currentGameData.damageTaken,
          cardsUsed: currentGameData.cardsUsed,
          defensesUsed: currentGameData.defensesUsed,
          rounds: newState.currentTurn + 1,
          opponent: 'Боты'
        });
        setIsGameFinished(true);
      }
    }

    return newState;
  }, [addLogMessage, roleSelection, addGame, currentGameData]);

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

    try {
      if (currentPlayer.role === 'hacker') {
        // === ХОД ХАКЕРА-БОТА ===
        const aliveCompanies = newState.companies.filter(c => c.isAlive !== false && c.health > 0);

        if (aliveCompanies.length > 0 && currentPlayer.chooseTarget) {
          const targetCompany = currentPlayer.chooseTarget(aliveCompanies);

          if (targetCompany && currentPlayer.chooseAttackCard) {
            const decision = currentPlayer.chooseAttackCard(targetCompany);

            if (decision) {
              if (decision.action === 'discard') {
                // Сброс карты
                const cardIndex = currentPlayer.hand.findIndex(c => c.id === decision.card.id);
                if (cardIndex !== -1) {
                  const discarded = currentPlayer.hand[cardIndex];
                  currentPlayer.hand.splice(cardIndex, 1);
                  const result = discardAndDraw(newState, 'hacker', currentPlayer.id, discarded.id);
                  newState = result.gameState;
                  addLogMessage(`🤖 ${currentPlayer.name} сбросил карту ${discarded.name}`);
                }
              } else {
                // Атака
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

                // Обновляем статистику урона
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
            }
          }
        }
      } else if (currentPlayer.role === 'company') {
        // === ХОД КОМПАНИИ-БОТА ===
        const company = newState.companies.find(c => c.id === currentPlayer.id);

        // Снимаем временные защиты
        if (company && company.temporaryDefenses && company.temporaryDefenses.length > 0) {
          const clearedNames = company.temporaryDefenses.map(d => d.name).join(', ');
          company.temporaryDefenses = [];
          addLogMessage(`🏢 ${company.name}: сняты временные защиты: ${clearedNames}`);
        }

        // Выбираем карту защиты
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
          }
        }
      }
    } catch (error) {
      console.error('Bot turn error:', error);
      addLogMessage(`⚠️ Ошибка при ходе бота ${currentPlayer.name}`);
    }

    // Переход к следующему игроку
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

  const startNewGame = (role) => {
    const newGame = initializeGameWithBots(role, 4, 2);

    // Скрываем характеристики компаний для хакера
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

    // Сбрасываем статистику текущей игры
    setCurrentGameData({
      damageDealt: 0,
      damageTaken: 0,
      cardsUsed: 0,
      defensesUsed: 0,
      rounds: 0
    });
    setIsGameFinished(false);

    setGameState(newGame);
    setRoleSelection(role);
    setSelectedAttackCard(null);
    setSelectedCompany(null);
    setSelectedDefenseCard(null);
    setMessage(`Игра началась! Вы играете за ${role === 'hacker' ? 'Хакера' : 'Компанию'}`);
    addLogMessage(`Игра началась! Роль: ${role === 'hacker' ? 'Хакер' : 'Компания'}`);
    addLogMessage(`--- РАУНД 1 ---`);
  };

  const endTurn = () => {
    if (!gameState || gameState.gameOver || isProcessing) return;

    const currentPlayer = getCurrentPlayer(gameState);
    if (!currentPlayer || !currentPlayer.isHuman) {
      setMessage('Сейчас не ваш ход!');
      return;
    }

    const newState = deepCopyGameState(gameState);

    // Снимаем временные защиты у компании-игрока
    if (currentPlayer.role === 'company') {
      const company = newState.companies.find(c => c.id === currentPlayer.id);
      if (company && company.temporaryDefenses && company.temporaryDefenses.length > 0) {
        const clearedNames = company.temporaryDefenses.map(d => d.name).join(', ');
        company.temporaryDefenses = [];
        addLogMessage(`🏢 ${company.name}: сняты временные защиты: ${clearedNames}`);
      }
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

    // Обновляем статистику
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

    let newState = deepCopyGameState(gameState);
    const result = executeAttack(newState, currentPlayer.id, selectedCompany.id, choosingCharacteristic, characteristic);
    newState = result.gameState;

    // Обновляем статистику
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

    // Бесплатный сброс для компании на высокую характеристику
    if (roleSelection === 'company') {
      const charValue = currentPlayer.characteristics?.[card.characteristic];
      if (charValue === 'high') {
        let newState = deepCopyGameState(gameState);
        const result = discardAndDraw(newState, 'company', currentPlayer.id, card.id);
        newState = result.gameState;
        setGameState(newState);
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
      addLogMessage(`🔄 ${card.name} сброшена и заменена`);
      setMessage(result.message);
    } else {
      setMessage(result.message);
    }
  };

  // ============================================================
  // РЕНДЕРИНГ
  // ============================================================

  // === ЭКРАН ВЫБОРА РОЛИ ===
  if (!roleSelection) {
    return (
      <div className="role-select">
        <h1>🛡️ Cyber Conflict</h1>
        <p className="subtitle">Выберите сторону в кибервойне</p>
        <div className="roles">
          <button className="role-btn role-hacker" onClick={() => startNewGame('hacker')}>
            🕵️ Хакер
            <div className="role-desc">Вы + 1 бот против 4 компаний</div>
          </button>
          <button className="role-btn role-company" onClick={() => startNewGame('company')}>
            🏢 Компания
            <div className="role-desc">Вы + 3 бота против 2 хакеров</div>
          </button>
        </div>
        <div className="rules">
          <h3>📖 Правила игры</h3>
          <p>• Хакеры атакуют компании, используя уязвимости</p>
          <p>• Компании защищают слабые характеристики</p>
          <p>• Атака на HIGH характеристику стоит хакеру 1 HP</p>
          <p>• Временные защиты действуют 1 ход</p>
          <p>• Компании с HIGH характеристикой сбрасывают карты бесплатно</p>
          <p>• Характеристики компаний скрыты до первой атаки или защиты</p>
        </div>
      </div>
    );
  }

  // === ЭКРАН ОКОНЧАНИЯ ИГРЫ ===
  if (gameState?.gameOver) {
    return (
      <div className="game-over">
        <h1>🏁 Игра окончена!</h1>
        <div className={`winner winner-${gameState.winner === 'hackers' ? 'hackers' : 'companies'}`}>
          {gameState.winner === 'hackers' ? '👾 Хакеры победили!' : '🏢 Компании победили!'}
        </div>
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
          processingRef.current = false;
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
        }}>
          🔄 Новая игра
        </button>
      </div>
    );
  }

  const currentPlayer = getCurrentPlayer(gameState);
  const isHumanTurn = currentPlayer?.isHuman && !isProcessing && !gameState?.gameOver;

  // === ОСНОВНОЙ ЭКРАН ИГРЫ ===
  return (
    <div className="container">
      {/* ===== ВЕРХНЯЯ ПАНЕЛЬ ===== */}
      <div className="top-panel">
        <div className="top-panel-left">
          <div className="round">🔁 РАУНД {gameState.currentTurn + 1}</div>
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
          {/* Кнопка профиля */}
          <button className="top-btn profile-btn" onClick={onShowProfile} title="Профиль">
            👤
          </button>
          <button className="top-btn stats-btn" onClick={() => setShowStats(true)} title="Статистика">
            📊
          </button>
          <button className="top-btn history-btn" onClick={() => setShowHistory(true)} title="История">
            📜
          </button>
          <button className="top-btn exit-btn" onClick={handleExitGame} title="Выйти из игры">
            🚪
          </button>
          <button className="top-btn logout-btn" onClick={onLogout} title="Выйти из аккаунта">
            🔓
          </button>
        </div>
      </div>

      {/* ===== СООБЩЕНИЕ ===== */}
      <div className="message-bar">
        <strong>{message || (isHumanTurn ? '🎯 Ваш ход! Выберите действие' : (isProcessing ? '🤖 Ход бота...' : 'Ожидание...'))}</strong>
      </div>

      {/* ===== КОМПАНИИ ===== */}
      <h2 style={{ color: 'white', marginBottom: '15px', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
        🏢 КОМПАНИИ ({gameState.companies.length})
      </h2>
      <div className="companies-grid">
        {gameState.companies.map(company => (
          <div
            key={company.id}
            className={`company-card ${isHumanTurn && roleSelection === 'hacker' ? 'selectable' : ''} ${selectedCompany?.id === company.id ? 'selected' : ''}`}
            onClick={() => {
              if (isHumanTurn && roleSelection === 'hacker') {
                setSelectedCompany(company);
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
                <div style={{ color: '#999' }}>Нет активных защит</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ===== ХАКЕРЫ ===== */}
      <h2 style={{ color: 'white', marginBottom: '15px', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
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

      {/* ===== РУКА ИГРОКА ===== */}
      {isHumanTurn && (
        <>
          {roleSelection === 'hacker' && (
            <Hand
              cards={currentPlayer.hand}
              type="attack"
              title="🗡️ ВАШИ КАРТЫ АТАК"
              onCardClick={(card) => setSelectedAttackCard(card)}
              selectedCardId={selectedAttackCard?.id}
              onDiscard={handleDiscardCard}
            />
          )}

          {roleSelection === 'company' && (
            <Hand
              cards={currentPlayer.hand}
              type="defense"
              title="🛡️ ВАШИ КАРТЫ ЗАЩИТЫ"
              onCardClick={(card) => setSelectedDefenseCard(card)}
              selectedCardId={selectedDefenseCard?.id}
              onDiscard={handleDiscardCard}
              playerCharacteristics={currentPlayer.characteristics}
            />
          )}

          {/* ===== ПАНЕЛЬ ДЕЙСТВИЙ ===== */}
          <div className="action-panel">
            <div className="actions-row">
              {roleSelection === 'hacker' && (
                <button
                  className="btn-attack"
                  onClick={handleAttack}
                  disabled={!selectedAttackCard || !selectedCompany}
                >
                  ⚔️ АТАКОВАТЬ
                </button>
              )}

              {roleSelection === 'company' && (
                <button
                  className="btn-defense"
                  onClick={handleUseDefense}
                  disabled={!selectedDefenseCard}
                >
                  🛡️ ЗАЩИТИТЬ
                </button>
              )}

              <button
                className="btn-clear"
                onClick={() => {
                  setSelectedAttackCard(null);
                  setSelectedDefenseCard(null);
                  setSelectedCompany(null);
                  setMessage('Выбор очищен');
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

      {/* ===== ИНДИКАТОР ХОДА БОТА ===== */}
      {isProcessing && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: 'rgba(255,255,255,0.9)',
          borderRadius: '12px',
          textAlign: 'center',
          border: '2px solid #6fbda8'
        }}>
          <p>🤖 <strong>{currentPlayer?.name}</strong> выполняет ход...</p>
          <div style={{ fontSize: '12px', color: '#666' }}>Пожалуйста, подождите</div>
        </div>
      )}

      {/* ===== ЛОГ ИГРЫ ===== */}
      <div className="log-container">
        <div className="log-title">📜 ЛОГ ИГРЫ</div>
        {gameLog.map((log, idx) => (
          <div key={idx} className="log-entry">
            <span className="time">[{new Date().toLocaleTimeString()}]</span> {log}
          </div>
        ))}
      </div>

      {/* ===== МОДАЛЬНОЕ ОКНО ДЛЯ ВЫБОРА ХАРАКТЕРИСТИКИ ===== */}
      {choosingCharacteristic && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Выберите характеристику для атаки</h3>
            {Object.entries(characteristicNames).map(([key, name]) => (
              <button
                key={key}
                className="modal-btn"
                onClick={() => handleAttackWithChar(key)}
              >
                {characteristicIcons[key] || '📊'} {name}
              </button>
            ))}
            <button
              className="modal-btn modal-btn-cancel"
              onClick={() => setChoosingCharacteristic(null)}
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* ===== МОДАЛЬНОЕ ОКНО СТАТИСТИКИ ===== */}
      {showStats && (
        <Stats
          stats={stats}
          onClose={() => setShowStats(false)}
          onClear={() => {
            if (window.confirm('Вы уверены, что хотите очистить всю статистику?')) {
              clearStats();
            }
          }}
        />
      )}

      {/* ===== МОДАЛЬНОЕ ОКНО ИСТОРИИ ===== */}
      {showHistory && (
        <History
          history={stats.history}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}