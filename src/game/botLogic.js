// ЛОГИКА ПОВЕДЕНИЯ БОТОВ

export function createHackerBot(id, name, difficulty = 'medium') {
  return {
    id: `hacker_bot_${id}`,
    name: name || `Бот-хакер ${id}`,
    health: 10,
    hand: [],
    isAlive: true,
    isHuman: false,
    role: 'hacker',
    difficulty: difficulty,

    chooseTarget(companies) {
      const aliveCompanies = companies.filter(c => c && c.isAlive !== false && c.health > 0);
      if (aliveCompanies.length === 0) return null;

      if (Math.random() < 0.3) {
        const randomIndex = Math.floor(Math.random() * aliveCompanies.length);
        return aliveCompanies[randomIndex];
      }

      return aliveCompanies.reduce((a, b) => a.health < b.health ? a : b);
    },

    chooseAttackCard(targetCompany) {
      if (!this.hand || this.hand.length === 0) return null;

      let bestCard = null;
      let bestScore = -Infinity;

      if (Math.random() < 0.1 && this.difficulty !== 'hard') {
        const randomIndex = Math.floor(Math.random() * this.hand.length);
        const card = this.hand[randomIndex];
        return { action: 'attack', card: card };
      }

      for (const card of this.hand) {
        let score = 0;

        if (card.type === 'single') {
          const char = card.characteristics[0];
          const value = targetCompany.characteristics?.[char];
          const hasDefense = this.checkDefense(targetCompany, char);

          if (value === 'low' && !hasDefense) score = 100;
          else if (value === 'low' && hasDefense) score = -50;
          else if (value === 'high') score = -100;
        } else if (card.type === 'double') {
          const [char1, char2] = card.characteristics;
          const val1 = targetCompany.characteristics?.[char1];
          const val2 = targetCompany.characteristics?.[char2];
          const def1 = this.checkDefense(targetCompany, char1);
          const def2 = this.checkDefense(targetCompany, char2);

          if (val1 === 'high') score = -100;
          else if (val1 === 'low' && !def1 && val2 === 'low' && !def2) score = 200;
          else if ((val1 === 'low' && !def1) || (val2 === 'low' && !def2)) score = 80;
          else score = -50;
        } else if (card.type === 'choose') {
          let hasGoodTarget = false;
          for (const [char, value] of Object.entries(targetCompany.characteristics || {})) {
            const hasDefense = this.checkDefense(targetCompany, char);
            if (value === 'low' && !hasDefense) {
              hasGoodTarget = true;
              break;
            }
          }
          score = hasGoodTarget ? 90 : -50;
        }

        if (score > 0) {
          score += (Math.random() - 0.5) * 20;
        }

        if (score > bestScore) {
          bestScore = score;
          bestCard = card;
        }
      }

      if (bestScore < 0 && this.difficulty === 'hard') {
        return { action: 'discard', card: bestCard };
      }

      if (bestScore > 0) {
        return { action: 'attack', card: bestCard };
      }

      if (bestScore < 0 && this.difficulty !== 'easy') {
        return { action: 'discard', card: bestCard };
      }

      return bestCard ? { action: 'attack', card: bestCard } : null;
    },

    checkDefense(company, characteristic) {
      const perm = company.permanentDefenses || [];
      const temp = company.temporaryDefenses || [];
      return perm.some(d => d?.characteristic === characteristic) ||
             temp.some(d => d?.characteristic === characteristic);
    }
  };
}

export function createCompanyBot(companyProfile, difficulty = 'medium') {
  return {
    id: companyProfile.id,
    name: companyProfile.name,
    characteristics: companyProfile.characteristics,
    health: 10,
    permanentDefenses: [],
    temporaryDefenses: [],
    hand: [],
    isAlive: true,
    isHuman: false,
    role: 'company',
    difficulty: difficulty,

    chooseDefenseCard() {
      if (!this.hand || this.hand.length === 0) return null;

      let bestCard = null;
      let bestScore = -Infinity;

      if (Math.random() < 0.15 && this.difficulty !== 'hard') {
        const randomIndex = Math.floor(Math.random() * this.hand.length);
        return this.hand[randomIndex];
      }

      for (const card of this.hand) {
        let score = 0;
        const charValue = this.characteristics?.[card.characteristic];

        if (charValue === 'low') score = 100;
        else if (charValue === 'high') score = -50;

        if (card.duration === 'permanent') score += 30;

        const alreadyDefended = (this.permanentDefenses || []).some(d => d?.characteristic === card.characteristic) ||
                                (this.temporaryDefenses || []).some(d => d?.characteristic === card.characteristic);
        if (alreadyDefended) score -= 80;

        if (score > 0) {
          score += (Math.random() - 0.5) * 15;
        }

        if (score > bestScore) {
          bestScore = score;
          bestCard = card;
        }
      }

      if (bestScore < 0 && this.difficulty === 'hard') {
        return { action: 'discard', card: bestCard };
      }

      return bestScore > 0 ? bestCard : null;
    }
  };
}