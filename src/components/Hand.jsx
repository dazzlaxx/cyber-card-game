import React from 'react';
import { Card } from './Card';

export function Hand({ cards, type, onCardClick, selectedCardId, title, onDiscard, playerCharacteristics }) {
  const isFreeDiscard = (card) => {
    if (type !== 'defense') return false;
    if (!playerCharacteristics) return false;
    return playerCharacteristics[card.characteristic] === 'high';
  };

  return (
    <div className="hand-container">
      <div className="hand-title">
        {title}
        <span className="count">{cards.length}</span>
      </div>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '10px',
        maxHeight: '320px',
        overflowY: 'auto'
      }}>
        {cards.map(card => {
          const freeDiscard = isFreeDiscard(card);

          return (
            <div key={card.id} style={{ position: 'relative' }}>
              <Card
                card={card}
                type={type}
                onClick={() => onCardClick(card)}
                isSelected={selectedCardId === card.id}
              />

              {onDiscard && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDiscard(card);
                  }}
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '12px',
                    backgroundColor: freeDiscard ? '#27ae60' : '#e74c3c',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title={freeDiscard ? 'Бесплатный сброс' : 'Сброс (стоит действия)'}
                >
                  ✕
                </button>
              )}

              {freeDiscard && (
                <div style={{
                  position: 'absolute',
                  bottom: '-8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: '#27ae60',
                  color: 'white',
                  fontSize: '9px',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  whiteSpace: 'nowrap'
                }}>
                  Бесплатно
                </div>
              )}
            </div>
          );
        })}

        {cards.length === 0 && (
          <p style={{ color: '#868e96', fontStyle: 'italic' }}>Нет карт</p>
        )}
      </div>
    </div>
  );
}
