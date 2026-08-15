// ПРОФИЛИ КОМПАНИЙ (20 уникальных комбинаций)

import { characteristicKeys } from './characteristics';

function generateAllCombinations() {
  const combinations = [];
  const keys = characteristicKeys;

  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      const profile = {};
      keys.forEach(key => {
        profile[key] = (key === keys[i] || key === keys[j]) ? 'high' : 'low';
      });
      combinations.push(profile);
    }
  }

  return combinations;
}

const uniqueCombinations = generateAllCombinations();
const companyTemplates = [...uniqueCombinations, ...uniqueCombinations];

const companyNames = [
  'ТехноГлобал', 'АльфаТех', 'БезопасныйМир', 'ИнновацияЛаб',
  'ФинансГрупп', 'КиберСекьюрити', 'ДиджиталСити', 'НекстДжен',
  'КлаудТех', 'ДатаХаб', 'СофтСолюшнс', 'НетворкПро',
  'СмартСистемс', 'АйТиЭксперт', 'ТехноПарк', 'БизнесСофт',
  'ВиртуалКорп', 'КиберДайнемикс'
];

export function generateCompanies(count) {
  const shuffled = [...companyTemplates];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count).map((profile, index) => {
    const nameIndex = index % companyNames.length;
    return {
      id: `company_${index + 1}`,
      name: companyNames[nameIndex] + ` ${index + 1}`,
      characteristics: { ...profile }
    };
  });
}