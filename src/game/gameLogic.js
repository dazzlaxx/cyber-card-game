// ОСНОВНАЯ ЛОГИКА ИГРЫ
import { shuffleArray } from './shuffle';
import { generateCompanies } from '../data/companyProfiles';
import { defenseCards } from '../data/defenseCards';
import { attackCards } from '../data/attackCards';
import { createHackerBot, createCompanyBot } from './botLogic';

let attackDiscardPile = [];
let defenseDiscardPile = [];

export function getNextAttackCard(deck, discardPile = null, originalDeck = null) {
  if (deck.length === 0) {
    if (discardPile && discardPile.length > 0) {
      const shuffled = shuffleArray([...discardPile]);
      deck.push(...shuffled);
      discardPile.length = 0;
    } else if (originalDeck && originalDeck.length > 0) {
      const shuffled = shuffleArray([...originalDeck]);
      deck.push(...shuffled);
    } else {
      return null;
    }
  }
  return deck.shift();
}

export function getNextDefenseCard(deck, discardPile = null, originalDeck = null) {
  if (deck.length === 0) {
    if (discardPile && discardPile.length > 0) {
      const shuffled = shuffleArray([...discardPile]);
      deck.push(...shuffled);
      discardPile.length = 0;
    } else if (originalDeck && originalDeck.length > 0) {
      const shuffled = shuffleArray([...originalDeck]);
      deck.push(...shuffled);
    } else {
      return null;
    }
  }
  return deck.shift();
}

export function addToDiscardPile(cardType, card) {
  if (!card) return;
  const cardCopy = { ...card };
  if (cardType === 'attack') {
    attackDiscardPile.push(cardCopy);
  } else if (cardType === 'defense') {
    defenseDiscardPile.push(cardCopy);
  }
}

export function clearDiscardPiles() {
  attackDiscardPile = [];
  defenseDiscardPile = [];
}

export function initializeGameWithBots(humanRole, numCompanies = 4, numBots = 2) {
  clearDiscardPiles();

  const generatedCompanies = generateCompanies(numCompanies);
  let companies = [];
  let hackers = [];
  let humanPlayer = null;

  if (humanRole === 'hacker') {
    humanPlayer = {
      id: 'human_hacker',
      name: 'Вы (Хакер)',
      health: 10,
      hand: [],
      isAlive: true,
      isHuman: true,
      role: 'hacker'
    };

    companies = generatedCompanies.map((company, idx) => {
      return createCompanyBot(company, 'medium');
    });

    hackers = [humanPlayer];
    hackers.push(createHackerBot(1, 'Бот-хакер', 'medium'));
  } else {
    const humanCompanyData = generatedCompanies[0];
    humanPlayer = {
      id: humanCompanyData.id,
      name: humanCompanyData.name,
      characteristics: humanCompanyData.characteristics,
      health: 10,
      hand: [],
      permanentDefenses: [],
      temporaryDefenses: [],
      isAlive: true,
      isHuman: true,
      role: 'company'
    };

    companies = [humanPlayer];
    for (let i = 1; i < numCompanies; i++) {
      companies.push(createCompanyBot(generatedCompanies[i], 'medium'));
    }

    hackers = [];
    for (let i = 1; i <= 2; i++) {
      hackers.push(createHackerBot(i, `Бот-хакер ${i}`, 'medium'));
    }
  }

  const allDefenseCards = [...defenseCards.temporary, ...defenseCards.permanent];
  const shuffledDefenseDeck = shuffleArray([...allDefenseCards]);
  const shuffledAttackDeck = shuffleArray([...attackCards]);

  companies.forEach((company) => {
    const hand = [];
    for (let i = 0; i < 3 && shuffledDefenseDeck.length > 0; i++) {
      const card = { ...shuffledDefenseDeck.shift() };
      if (!card.id) card.id = `defense_${Date.now()}_${i}_${Math.random()}`;
      hand.push(card);
    }
    company.hand = hand;
  });

  hackers.forEach((hacker) => {
    const hand = [];
    for (let i = 0; i < 3 && shuffledAttackDeck.length > 0; i++) {
      const card = { ...shuffledAttackDeck.shift() };
      if (!card.id) card.id = `attack_${Date.now()}_${i}_${Math.random()}`;
      hand.push(card);
    }
    hacker.hand = hand;
  });

  return {
    companies,
    hackers,
    humanPlayer,
    humanRole,
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

export function checkDefense(company, characteristic) {
  const permanentDefenses = company.permanentDefenses || [];
  const temporaryDefenses = company.temporaryDefenses || [];
  return permanentDefenses.some(d => d && d.characteristic === characteristic) ||
         temporaryDefenses.some(d => d && d.characteristic === characteristic);
}

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

  if (attackCard.type === 'single') {
    const char = attackCard.characteristics[0];
    const hasDefense = checkDefense(company, char);
    const charValue = company.characteristics?.[char];
    usedCharacteristics = [char];

    if (hasDefense) {
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
  } else if (attackCard.type === 'double') {
    const [char1, char2] = attackCard.characteristics;
    const hasDefense1 = checkDefense(company, char1);
    const hasDefense2 = checkDefense(company, char2);
    const val1 = company.characteristics?.[char1];
    const val2 = company.characteristics?.[char2];
    usedCharacteristics = [char1, char2];

    if (hasDefense1) {
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

  if (!success) {
    hacker.health -= 1;
    addToDiscardPile('attack', attackCard);
    const cardIndex = hacker.hand.findIndex(c => c.id === attackCard.id);
    if (cardIndex !== -1) {
      hacker.hand.splice(cardIndex, 1);
    }
    const newCard = getNextAttackCard(gameState.attackDeck, gameState.attackDiscardPile, attackCards);
    if (newCard) {
      hacker.hand.push(newCard);
    }
    if (hacker.health <= 0) {
      hacker.isAlive = false;
      const index = gameState.hackers.findIndex(h => h.id === hackerId);
      if (index !== -1) gameState.hackers.splice(index, 1);
    }
    return { success: false, message, damage: 0, gameState };
  }

  company.health -= damage;

  usedCharacteristics.forEach(char => {
    if (company.temporaryDefenses) {
      company.temporaryDefenses = company.temporaryDefenses.filter(d => d?.characteristic !== char);
    }
    // Раскрываем характеристику
    if (!company.revealedCharacteristics) {
      company.revealedCharacteristics = [];
    }
    if (!company.revealedCharacteristics.includes(char)) {
      company.revealedCharacteristics.push(char);
    }
  });

  addToDiscardPile('attack', attackCard);
  const cardIndex = hacker.hand.findIndex(c => c.id === attackCard.id);
  if (cardIndex !== -1) {
    hacker.hand.splice(cardIndex, 1);
  }
  const newCard = getNextAttackCard(gameState.attackDeck, gameState.attackDiscardPile, attackCards);
  if (newCard) {
    hacker.hand.push(newCard);
  }

  if (company.health <= 0) {
    company.isAlive = false;
    const index = gameState.companies.findIndex(c => c.id === companyId);
    if (index !== -1) gameState.companies.splice(index, 1);
  }

  return { success: true, message, damage, gameState };
}

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

  if (defenseCard.duration === 'permanent') {
    if (!company.permanentDefenses) company.permanentDefenses = [];
    company.permanentDefenses.push(usedCard);
  } else {
    if (!company.temporaryDefenses) company.temporaryDefenses = [];
    company.temporaryDefenses.push(usedCard);
  }

  // Раскрываем защищённую характеристику
  if (!company.revealedCharacteristics) {
    company.revealedCharacteristics = [];
  }
  if (!company.revealedCharacteristics.includes(defenseCard.characteristic)) {
    company.revealedCharacteristics.push(defenseCard.characteristic);
  }

  addToDiscardPile('defense', usedCard);
  const newCard = getNextDefenseCard(gameState.defenseDeck, gameState.defenseDiscardPile,
    [...defenseCards.temporary, ...defenseCards.permanent]);
  if (newCard) {
    company.hand.push(newCard);
  }

  return { success: true, message: `Защита ${defenseCard.name} активирована`, gameState };
}

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

export function clearCompanyTemporaryDefenses(company) {
  if (company && company.temporaryDefenses) {
    company.temporaryDefenses = [];
  }
  return company;
}