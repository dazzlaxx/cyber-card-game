// ============================================================
// ОСНОВНАЯ ЛОГИКА ИГРЫ "CYBER CONFLICT"
// ============================================================

import { shuffleArray } from './shuffle';
import { generateCompanies } from '../data/companyProfiles';
import { defenseCards } from '../data/defenseCards';
import { attackCards } from '../data/attackCards';
import { createHackerBot, createCompanyBot } from './botLogic';

// ============================================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ДЛЯ СБРОСА КАРТ
// ============================================================
let attackDiscardPile = [];
let defenseDiscardPile = [];

// ============================================================
// ФУНКЦИИ УПРАВЛЕНИЯ КОЛОДАМИ
// ============================================================

/**
 * Получает следующую карту атаки из колоды.
 * Если колода пуста - перетасовывает сброс или создаёт новую колоду.
 * @param {Array} deck - текущая колода атаки
 * @param {Array} discardPile - массив сброса атаки
 * @param {Array} originalDeck - оригинальная колода атаки
 * @returns {Object|null} - карта атаки или null
 */
export function getNextAttackCard(deck, discardPile = null, originalDeck = null) {
  if (deck.length === 0) {
    console.log('⚠️ Колода атаки пуста!');

    if (discardPile && discardPile.length > 0) {
      const shuffled = shuffleArray([...discardPile]);
      deck.push(...shuffled);
      discardPile.length = 0;
      console.log(`🔄 Колода атаки перетасована из сброса (${deck.length} карт)`);
    } else if (originalDeck && originalDeck.length > 0) {
      const shuffled = shuffleArray([...originalDeck]);
      deck.push(...shuffled);
      console.log(`🔄 Создана новая колода атаки из оригинальной (${deck.length} карт)`);
    } else {
      console.error('❌ Нет карт в колоде атаки и сбросе!');
      return null;
    }
  }

  const card = deck.shift();
  console.log(`📤 Взята карта атаки: ${card?.name || 'неизвестная'}, осталось: ${deck.length}`);
  return card;
}

/**
 * Получает следующую карту защиты из колоды.
 * Если колода пуста - перетасовывает сброс или создаёт новую колоду.
 * @param {Array} deck - текущая колода защиты
 * @param {Array} discardPile - массив сброса защиты
 * @param {Array} originalDeck - оригинальная колода защиты
 * @returns {Object|null} - карта защиты или null
 */
export function getNextDefenseCard(deck, discardPile = null, originalDeck = null) {
  if (deck.length === 0) {
    console.log('⚠️ Колода защиты пуста!');

    if (discardPile && discardPile.length > 0) {
      const shuffled = shuffleArray([...discardPile]);
      deck.push(...shuffled);
      discardPile.length = 0;
      console.log(`🔄 Колода защиты перетасована из сброса (${deck.length} карт)`);
    } else if (originalDeck && originalDeck.length > 0) {
      const shuffled = shuffleArray([...originalDeck]);
      deck.push(...shuffled);
      console.log(`🔄 Создана новая колода защиты из оригинальной (${deck.length} карт)`);
    } else {
      console.error('❌ Нет карт в колоде защиты и сбросе!');
      return null;
    }
  }

  const card = deck.shift();
  console.log(`📤 Взята карта защиты: ${card?.name || 'неизвестная'}, осталось: ${deck.length}`);
  return card;
}

/**
 * Добавляет карту в сброс.
 * @param {string} cardType - 'attack' или 'defense'
 * @param {Object} card - карта для добавления
 */
export function addToDiscardPile(cardType, card) {
  if (!card) return;
  const cardCopy = { ...card };

  if (cardType === 'attack') {
    attackDiscardPile.push(cardCopy);
    console.log(`🗑️ Карта атаки "${card.name}" добавлена в сброс (всего: ${attackDiscardPile.length})`);
  } else if (cardType === 'defense') {
    defenseDiscardPile.push(cardCopy);
    console.log(`🗑️ Карта защиты "${card.name}" добавлена в сброс (всего: ${defenseDiscardPile.length})`);
  }
}

/**
 * Очищает сброс (вызывается при старте новой игры).
 */
export function clearDiscardPiles() {
  attackDiscardPile = [];
  defenseDiscardPile = [];
  console.log('🧹 Сброс очищен');
}

/**
 * Возвращает количество карт в сбросе.
 * @returns {Object} - { attack: number, defense: number }
 */
export function getDiscardPileInfo() {
  return {
    attack: attackDiscardPile.length,
    defense: defenseDiscardPile.length
  };
}

// ============================================================
// ФУНКЦИЯ ИНИЦИАЛИЗАЦИИ ИГРЫ (с поддержкой режимов)
// ============================================================

/**
 * Инициализирует новую игру с ботами.
 * @param {string} humanRole - 'hacker' или 'company'
 * @param {number} numCompanies - количество компаний (по умолчанию 4)
 * @param {number} numBots - количество ботов-хакеров (по умолчанию 2)
 * @param {string} mode - 'normal' или 'fast'
 * @returns {Object} - начальное состояние игры
 */
export function initializeGameWithBots(humanRole, numCompanies = 4, numBots = 2, mode = 'normal') {
  // Очищаем сброс при старте новой игры
  clearDiscardPiles();

  // Настройки в зависимости от режима
  const healthPoints = mode === 'fast' ? 6 : 10;
  const handSize = mode === 'fast' ? 2 : 3;

  console.log(`🎮 Инициализация игры: Роль=${humanRole}, Режим=${mode}, HP=${healthPoints}, Карт в руке=${handSize}`);

  const generatedCompanies = generateCompanies(numCompanies);
  let companies = [];
  let hackers = [];
  let humanPlayer = null;

  if (humanRole === 'hacker') {
    // ===== ИГРОК ЗА ХАКЕРА =====
    humanPlayer = {
      id: 'human_hacker',
      name: 'Вы (Хакер)',
      health: healthPoints,
      hand: [],
      isAlive: true,
      isHuman: true,
      role: 'hacker'
    };

    // Создаём компании-боты
    companies = generatedCompanies.map((company, idx) => {
      const bot = createCompanyBot(company, 'medium');
      bot.health = healthPoints;
      return bot;
    });

    // Создаём хакеров (игрок + 1 бот)
    hackers = [humanPlayer];
    const botHacker = createHackerBot(1, 'Бот-хакер', 'medium');
    botHacker.health = healthPoints;
    hackers.push(botHacker);

    console.log(`👾 Хакеры: 1 игрок + 1 бот (всего ${hackers.length})`);
    console.log(`🏢 Компании: ${companies.length} ботов`);

  } else {
    // ===== ИГРОК ЗА КОМПАНИЮ =====
    const humanCompanyData = generatedCompanies[0];
    humanPlayer = {
      id: humanCompanyData.id,
      name: humanCompanyData.name,
      characteristics: humanCompanyData.characteristics,
      health: healthPoints,
      hand: [],
      permanentDefenses: [],
      temporaryDefenses: [],
      isAlive: true,
      isHuman: true,
      role: 'company'
    };

    // Создаём компании (игрок + 3 бота)
    companies = [humanPlayer];
    for (let i = 1; i < numCompanies; i++) {
      const bot = createCompanyBot(generatedCompanies[i], 'medium');
      bot.health = healthPoints;
      companies.push(bot);
    }

    // Создаём хакеров-ботов (2 штуки)
    hackers = [];
    for (let i = 1; i <= 2; i++) {
      const bot = createHackerBot(i, `Бот-хакер ${i}`, 'medium');
      bot.health = healthPoints;
      hackers.push(bot);
    }

    console.log(`👾 Хакеры: 2 бота (всего ${hackers.length})`);
    console.log(`🏢 Компании: 1 игрок + 3 бота (всего ${companies.length})`);
  }

  // ===== ФОРМИРУЕМ КОЛОДЫ =====
  const allDefenseCards = [...defenseCards.temporary, ...defenseCards.permanent];
  const shuffledDefenseDeck = shuffleArray([...allDefenseCards]);
  const shuffledAttackDeck = shuffleArray([...attackCards]);

  // ===== РАЗДАЁМ КАРТЫ КОМПАНИЯМ =====
  companies.forEach((company) => {
    const hand = [];
    for (let i = 0; i < handSize && shuffledDefenseDeck.length > 0; i++) {
      const card = { ...shuffledDefenseDeck.shift() };
      if (!card.id) card.id = `defense_${Date.now()}_${i}_${Math.random()}`;
      hand.push(card);
    }
    company.hand = hand;
    console.log(`🏢 ${company.name} получил ${hand.length} карт защиты`);
  });

  // ===== РАЗДАЁМ КАРТЫ ХАКЕРАМ =====
  hackers.forEach((hacker) => {
    const hand = [];
    for (let i = 0; i < handSize && shuffledAttackDeck.length > 0; i++) {
      const card = { ...shuffledAttackDeck.shift() };
      if (!card.id) card.id = `attack_${Date.now()}_${i}_${Math.random()}`;
      hand.push(card);
    }
    hacker.hand = hand;
    console.log(`👾 ${hacker.name} получил ${hand.length} карт атаки`);
  });

  console.log(`📊 Статистика колод:
    - Атака: ${shuffledAttackDeck.length} карт в колоде
    - Защита: ${shuffledDefenseDeck.length} карт в колоде
    - Сброс атаки: ${attackDiscardPile.length} карт
    - Сброс защиты: ${defenseDiscardPile.length} карт`);

  // ===== ВОЗВРАЩАЕМ СОСТОЯНИЕ =====
  return {
    companies,
    hackers,
    humanPlayer,
    humanRole,
    mode: mode,
    healthPoints: healthPoints,
    handSize: handSize,
    currentTurn: 0,
    currentPlayerIndex: 0,
    gameOver: false,
    winner: null,
    attackDeck: shuffledAttackDeck,
    defenseDeck: shuffledDefenseDeck,
    attackDiscardPile: attackDiscardPile,
    defenseDiscardPile: defenseDiscardPile
  };
}

// ============================================================
// ФУНКЦИИ АТАКИ
// ============================================================

/**
 * Проверяет, защищена ли характеристика компании.
 * @param {Object} company - компания
 * @param {string} characteristic - ключ характеристики
 * @returns {boolean} - true если защищена
 */
export function checkDefense(company, characteristic) {
  const permanentDefenses = company.permanentDefenses || [];
  const temporaryDefenses = company.temporaryDefenses || [];
  return permanentDefenses.some(d => d && d.characteristic === characteristic) ||
         temporaryDefenses.some(d => d && d.characteristic === characteristic);
}

/**
 * Выполняет атаку хакера на компанию.
 * @param {Object} gameState - текущее состояние игры
 * @param {string} hackerId - ID хакера
 * @param {string} companyId - ID компании-цели
 * @param {Object} attackCard - карта атаки
 * @param {string|null} selectedChar - выбранная характеристика (для choose-карт)
 * @returns {Object} - { success, message, damage, gameState }
 */
export function executeAttack(gameState, hackerId, companyId, attackCard, selectedChar = null) {
  const hacker = gameState.hackers.find(h => h.id === hackerId);
  const company = gameState.companies.find(c => c.id === companyId);

  if (!hacker || !company || hacker.health <= 0 || company.health <= 0) {
    return { success: false, message: 'Недопустимый ход', gameState };
  }

  let success = false;
  let message = '';
  let damage = 0;
  let usedCharacteristics = [];

  // === ОБРАБОТКА SINGLE-АТАКИ ===
  if (attackCard.type === 'single') {
    const char = attackCard.characteristics[0];
    const hasDefense = checkDefense(company, char);
    const charValue = company.characteristics?.[char];
    usedCharacteristics = [char];

    if (hasDefense) {
      // Снимаем защиту (и временную, и постоянную)
      company.permanentDefenses = company.permanentDefenses.filter(d => d?.characteristic !== char);
      company.temporaryDefenses = company.temporaryDefenses.filter(d => d?.characteristic !== char);
      message = `Атака провалена: ${char} защищена, защита снята`;
      success = false;
      damage = 0;
    } else if (charValue === 'low') {
      message = `Атака успешна! ${char} уязвима`;
      success = true;
      damage = 1;
    } else {
      message = `Атака провалена: ${char} высокая`;
      success = false;
      damage = 0;
    }

  // === ОБРАБОТКА DOUBLE-АТАКИ ===
  } else if (attackCard.type === 'double') {
    const [char1, char2] = attackCard.characteristics;
    const hasDefense1 = checkDefense(company, char1);
    const hasDefense2 = checkDefense(company, char2);
    const val1 = company.characteristics?.[char1];
    const val2 = company.characteristics?.[char2];
    usedCharacteristics = [char1, char2];

    if (hasDefense1) {
      // Снимаем защиту с первой характеристики
      company.permanentDefenses = company.permanentDefenses.filter(d => d?.characteristic !== char1);
      company.temporaryDefenses = company.temporaryDefenses.filter(d => d?.characteristic !== char1);
      message = `Атака провалена: ${char1} защищена, защита снята`;
      success = false;
      damage = 0;
    } else if (val1 === 'high') {
      message = `Атака провалена: первая характеристика высокая`;
      success = false;
      damage = 0;
    } else if (val1 === 'low' && val2 === 'low') {
      if (hasDefense2) {
        // Снимаем защиту со второй характеристики
        company.permanentDefenses = company.permanentDefenses.filter(d => d?.characteristic !== char2);
        company.temporaryDefenses = company.temporaryDefenses.filter(d => d?.characteristic !== char2);
        message = `Атака частично успешна: ${char1} уязвима, ${char2} защищена`;
        success = true;
        damage = 1;
      } else {
        message = `Атака успешна! Обе характеристики уязвимы`;
        success = true;
        damage = 2;
      }
    } else if (val1 === 'low') {
      message = `Атака частично успешна`;
      success = true;
      damage = 1;
    } else {
      message = `Атака провалена`;
      success = false;
      damage = 0;
    }

  // === ОБРАБОТКА CHOOSE-АТАКИ ===
  } else if (attackCard.type === 'choose' && selectedChar) {
    const hasDefense = checkDefense(company, selectedChar);
    const charValue = company.characteristics?.[selectedChar];
    usedCharacteristics = [selectedChar];

    if (hasDefense) {
      company.permanentDefenses = company.permanentDefenses.filter(d => d?.characteristic !== selectedChar);
      company.temporaryDefenses = company.temporaryDefenses.filter(d => d?.characteristic !== selectedChar);
      message = `Атака провалена: ${selectedChar} защищена, защита снята`;
      success = false;
      damage = 0;
    } else if (charValue === 'low') {
      message = `Атака успешна! ${selectedChar} уязвима`;
      success = true;
      damage = 1;
    } else {
      message = `Атака провалена: ${selectedChar} высокая`;
      success = false;
      damage = 0;
    }
  }

  // === ЕСЛИ АТАКА ПРОВАЛЕНА ===
  if (!success) {
    // Хакер теряет 1 HP за рискованную атаку
    hacker.health -= 1;

    // Добавляем карту в сброс
    addToDiscardPile('attack', attackCard);

    // Удаляем карту из руки
    const cardIndex = hacker.hand.findIndex(c => c.id === attackCard.id);
    if (cardIndex !== -1) {
      hacker.hand.splice(cardIndex, 1);
    }

    // Берём новую карту из колоды
    const newCard = getNextAttackCard(gameState.attackDeck, gameState.attackDiscardPile, attackCards);
    if (newCard) {
      hacker.hand.push(newCard);
    }

    // Проверяем, не умер ли хакер
    if (hacker.health <= 0) {
      hacker.isAlive = false;
      const index = gameState.hackers.findIndex(h => h.id === hackerId);
      if (index !== -1) gameState.hackers.splice(index, 1);
    }

    return { success: false, message, damage: 0, gameState };
  }

  // === ЕСЛИ АТАКА УСПЕШНА ===
  // Наносим урон компании
  company.health -= damage;

  // Снимаем временные защиты с атакованных характеристик
  usedCharacteristics.forEach(char => {
    if (company.temporaryDefenses) {
      company.temporaryDefenses = company.temporaryDefenses.filter(d => d?.characteristic !== char);
    }
  });

  // Раскрываем характеристики для игрока-хакера
  usedCharacteristics.forEach(char => {
    if (!company.revealedCharacteristics) {
      company.revealedCharacteristics = [];
    }
    if (!company.revealedCharacteristics.includes(char)) {
      company.revealedCharacteristics.push(char);
      console.log(`🔍 Раскрыта характеристика ${char} у компании ${company.name}`);
    }
  });

  // Добавляем карту в сброс
  addToDiscardPile('attack', attackCard);

  // Удаляем карту из руки
  const cardIndex = hacker.hand.findIndex(c => c.id === attackCard.id);
  if (cardIndex !== -1) {
    hacker.hand.splice(cardIndex, 1);
  }

  // Берём новую карту из колоды
  const newCard = getNextAttackCard(gameState.attackDeck, gameState.attackDiscardPile, attackCards);
  if (newCard) {
    hacker.hand.push(newCard);
  }

  // Проверяем, не умерла ли компания
  if (company.health <= 0) {
    company.isAlive = false;
    const index = gameState.companies.findIndex(c => c.id === companyId);
    if (index !== -1) gameState.companies.splice(index, 1);
  }

  return { success: true, message, damage, gameState };
}

// ============================================================
// ФУНКЦИИ ЗАЩИТЫ
// ============================================================

/**
 * Активирует карту защиты компании.
 * @param {Object} gameState - текущее состояние игры
 * @param {string} companyId - ID компании
 * @param {Object} defenseCard - карта защиты
 * @returns {Object} - { success, message, gameState }
 */
export function useDefenseCard(gameState, companyId, defenseCard) {
  const company = gameState.companies.find(c => c.id === companyId);

  if (!company) {
    return { success: false, message: 'Компания не найдена', gameState };
  }

  const cardIndex = company.hand.findIndex(c => c.id === defenseCard.id);
  if (cardIndex === -1) {
    return { success: false, message: 'Карты нет в руке', gameState };
  }

  const usedCard = company.hand[cardIndex];
  company.hand.splice(cardIndex, 1);

  // Проверяем, не защищена ли уже характеристика
  const alreadyDefended = (company.permanentDefenses || []).some(d => d?.characteristic === defenseCard.characteristic) ||
                          (company.temporaryDefenses || []).some(d => d?.characteristic === defenseCard.characteristic);

  if (alreadyDefended) {
    addToDiscardPile('defense', usedCard);
    const newCard = getNextDefenseCard(gameState.defenseDeck, gameState.defenseDiscardPile,
      [...defenseCards.temporary, ...defenseCards.permanent]);
    if (newCard) {
      company.hand.push(newCard);
    }
    return { success: false, message: 'Характеристика уже защищена, карта сброшена', gameState };
  }

  // Применяем защиту
  if (defenseCard.duration === 'permanent') {
    if (!company.permanentDefenses) company.permanentDefenses = [];
    company.permanentDefenses.push(usedCard);
    console.log(`✅ Постоянная защита ${usedCard.name} активирована для ${company.name}`);
  } else {
    if (!company.temporaryDefenses) company.temporaryDefenses = [];
    company.temporaryDefenses.push(usedCard);
    console.log(`⏳ Временная защита ${usedCard.name} активирована для ${company.name}`);
  }

  // Раскрываем защищённую характеристику
  if (!company.revealedCharacteristics) {
    company.revealedCharacteristics = [];
  }
  if (!company.revealedCharacteristics.includes(defenseCard.characteristic)) {
    company.revealedCharacteristics.push(defenseCard.characteristic);
    console.log(`🔍 Раскрыта характеристика ${defenseCard.characteristic} у компании ${company.name} (защита)`);
  }

  addToDiscardPile('defense', usedCard);
  const newCard = getNextDefenseCard(gameState.defenseDeck, gameState.defenseDiscardPile,
    [...defenseCards.temporary, ...defenseCards.permanent]);
  if (newCard) {
    company.hand.push(newCard);
  }

  return { success: true, message: `Защита ${defenseCard.name} активирована`, gameState };
}

// ============================================================
// ФУНКЦИИ СБРОСА КАРТ
// ============================================================

/**
 * Сбрасывает карту и берёт новую из колоды.
 * @param {Object} gameState - текущее состояние игры
 * @param {string} playerType - 'hacker' или 'company'
 * @param {string} playerId - ID игрока
 * @param {string} cardId - ID карты для сброса
 * @returns {Object} - { success, message, gameState }
 */
export function discardAndDraw(gameState, playerType, playerId, cardId) {
  if (playerType === 'hacker') {
    const hacker = gameState.hackers.find(h => h.id === playerId);
    if (!hacker) return { success: false, message: 'Хакер не найден', gameState };

    const cardIndex = hacker.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return { success: false, message: 'Карта не найдена', gameState };

    const discardedCard = hacker.hand[cardIndex];
    hacker.hand.splice(cardIndex, 1);

    addToDiscardPile('attack', discardedCard);
    const newCard = getNextAttackCard(gameState.attackDeck, gameState.attackDiscardPile, attackCards);
    if (newCard) {
      hacker.hand.push(newCard);
    }

    return { success: true, message: 'Карта сброшена', gameState };

  } else {
    const company = gameState.companies.find(c => c.id === playerId);
    if (!company) return { success: false, message: 'Компания не найдена', gameState };

    const cardIndex = company.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return { success: false, message: 'Карта не найдена', gameState };

    const discardedCard = company.hand[cardIndex];
    company.hand.splice(cardIndex, 1);

    addToDiscardPile('defense', discardedCard);
    const newCard = getNextDefenseCard(gameState.defenseDeck, gameState.defenseDiscardPile,
      [...defenseCards.temporary, ...defenseCards.permanent]);
    if (newCard) {
      company.hand.push(newCard);
    }

    return { success: true, message: 'Карта сброшена', gameState };
  }
}

// ============================================================
// ФУНКЦИИ УПРАВЛЕНИЯ ВРЕМЕННЫМИ ЗАЩИТАМИ
// ============================================================

/**
 * Снимает все временные защиты со всех компаний.
 * @param {Object} gameState - текущее состояние игры
 * @returns {Object} - обновлённое состояние
 */
export function clearTemporaryDefenses(gameState) {
  gameState.companies.forEach(company => {
    if (company.temporaryDefenses && company.temporaryDefenses.length > 0) {
      const clearedCount = company.temporaryDefenses.length;
      const clearedNames = company.temporaryDefenses.map(d => d.name).join(', ');
      company.temporaryDefenses = [];
      console.log(`🔄 У компании ${company.name} снято ${clearedCount} временных защит: ${clearedNames}`);
    }
  });
  return gameState;
}

/**
 * Снимает временные защиты у конкретной компании.
 * @param {Object} company - компания
 * @returns {Object} - обновлённая компания
 */
export function clearCompanyTemporaryDefenses(company) {
  if (company && company.temporaryDefenses && company.temporaryDefenses.length > 0) {
    const clearedCount = company.temporaryDefenses.length;
    const clearedNames = company.temporaryDefenses.map(d => d.name).join(', ');
    company.temporaryDefenses = [];
    console.log(`🔄 У компании ${company.name} снято ${clearedCount} временных защит: ${clearedNames}`);
  }
  return company;
}

// ============================================================
// ФУНКЦИИ РАСКРЫТИЯ ХАРАКТЕРИСТИК
// ============================================================

/**
 * Раскрывает характеристику компании для игрока-хакера.
 * @param {Object} company - компания
 * @param {string} characteristic - ключ характеристики
 */
export function revealCharacteristic(company, characteristic) {
  if (!company.revealedCharacteristics) {
    company.revealedCharacteristics = [];
  }
  if (!company.revealedCharacteristics.includes(characteristic)) {
    company.revealedCharacteristics.push(characteristic);
    console.log(`🔍 Раскрыта характеристика ${characteristic} у компании ${company.name}`);
  }
}

/**
 * Проверяет, раскрыта ли характеристика для игрока.
 * @param {Object} company - компания
 * @param {string} characteristic - ключ характеристики
 * @param {boolean} isHuman - является ли игрок человеком
 * @returns {boolean} - true если раскрыта
 */
export function isCharacteristicRevealed(company, characteristic, isHuman) {
  if (!isHuman) return true; // Боты видят все
  return company.revealedCharacteristics?.includes(characteristic) || false;
}

// ============================================================
// ОТЛАДОЧНЫЕ ФУНКЦИИ
// ============================================================

/**
 * Выводит информацию о состоянии колод.
 * @param {Object} gameState - текущее состояние игры
 */
export function logDeckStatus(gameState) {
  console.log('📊 СТАТУС КОЛОД:');
  console.log(`  - Колода атаки: ${gameState.attackDeck?.length || 0} карт`);
  console.log(`  - Сброс атаки: ${gameState.attackDiscardPile?.length || 0} карт`);
  console.log(`  - Колода защиты: ${gameState.defenseDeck?.length || 0} карт`);
  console.log(`  - Сброс защиты: ${gameState.defenseDiscardPile?.length || 0} карт`);

  const totalAttack = (gameState.attackDeck?.length || 0) + (gameState.attackDiscardPile?.length || 0);
  const totalDefense = (gameState.defenseDeck?.length || 0) + (gameState.defenseDiscardPile?.length || 0);

  console.log(`  - Всего карт атаки: ${totalAttack}`);
  console.log(`  - Всего карт защиты: ${totalDefense}`);
}

/**
 * Выводит информацию о состоянии игры.
 * @param {Object} gameState - текущее состояние игры
 */
export function logGameState(gameState) {
  if (!gameState) {
    console.log('❌ Состояние игры не инициализировано');
    return;
  }

  console.log('🎮 СОСТОЯНИЕ ИГРЫ:');
  console.log(`  - Режим: ${gameState.mode || 'normal'}`);
  console.log(`  - Раунд: ${gameState.currentTurn + 1}`);
  console.log(`  - Ход игрока: ${gameState.currentPlayerIndex}`);
  console.log(`  - Игра окончена: ${gameState.gameOver ? 'Да' : 'Нет'}`);
  console.log(`  - Хакеров: ${gameState.hackers.length}`);
  console.log(`  - Компаний: ${gameState.companies.length}`);
  
  gameState.hackers.forEach(h => {
    console.log(`    👾 ${h.name}: HP=${h.health}, Карт=${h.hand?.length || 0}`);
  });
  
  gameState.companies.forEach(c => {
    console.log(`    🏢 ${c.name}: HP=${c.health}, Карт=${c.hand?.length || 0}`);
  });
}