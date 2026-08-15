// КОМПОНЕНТ КАРТЫ

import React from 'react';
import { characteristicNames, characteristicIcons } from '../data/characteristics';

export function Card({ card, type, onClick, isSelected }) {
  if (!card) return null;

  const getCardColor = () => {
    if (type === 'attack') return '#e74c3c';
    if (type === 'defense') return '#2ecc71';
    if (type === 'company') return '#6fbda8';
    return '#dfe6e9';
  };

  // Проверяем, нужно ли скрывать характеристики
  const shouldHideCharacteristics = () => {
    if (type !== 'company') return false;
    // Если это компания игрока - показываем всё
    if (card.isHuman) return false;
    // Если есть флаг скрытия - скрываем
    return card.hideCharacteristics === true;
  };

  const hideChars = shouldHideCharacteristics();

  return (
    <div
      onClick={onClick}
      className={`card ${isSelected ? 'selected' : ''} card-${type}`}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        borderTopColor: getCardColor(),
        width: '180px',
        minHeight: '200px'
      }}
    >
      <h3 style={{ fontSize: '13px', margin: '0 0 8px 0', color: '#2c3e50' }}>{card.name}</h3>

      {type === 'attack' && (
        <>
          <div style={{ fontSize: '12px', color: '#7f8c8d' }}>⚔️ Урон: {card.damage}</div>
          <div style={{ fontSize: '11px', color: '#e74c3c', marginTop: '5px' }}>
            🎯 Цели: {card.characteristics?.map(c => characteristicNames[c] || c).join(', ') || 'Выбираемая'}
          </div>
          {card.description && (
            <p style={{ fontSize: '10px', color: '#95a5a6', marginTop: '8px', marginBottom: '0', fontStyle: 'italic' }}>
              {card.description}
            </p>
          )}
        </>
      )}

      {type === 'defense' && (
        <>
          <div style={{ fontSize: '12px', color: '#27ae60' }}>
            🛡️ Тип: {card.duration === 'permanent' ? 'Постоянная' : 'Одноразовая'}
          </div>
          <div style={{ fontSize: '11px', color: '#2980b9', marginTop: '5px' }}>
            {characteristicIcons[card.characteristic] || '📊'} Защищает: {characteristicNames[card.characteristic] || card.characteristic}
          </div>
          {card.description && (
            <p style={{ fontSize: '10px', color: '#95a5a6', marginTop: '8px', marginBottom: '0', fontStyle: 'italic' }}>
              {card.description}
            </p>
          )}
        </>
      )}

      {type === 'company' && card.characteristics && (
        <div style={{ fontSize: '11px', marginTop: '8px' }}>
          {Object.entries(card.characteristics).map(([key, value]) => {
            // Проверяем, раскрыта ли характеристика
            const isRevealed = card.revealedCharacteristics?.includes(key) || false;

            // Если характеристики скрыты И характеристика не раскрыта
            if (hideChars && !isRevealed) {
              return (
                <div key={key} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '3px',
                  opacity: 0.5,
                  fontStyle: 'italic'
                }}>
                  <span>{characteristicIcons[key] || '❓'} {characteristicNames[key]}:</span>
                  <span style={{ color: '#95a5a6' }}>🔒 Скрыто</span>
                </div>
              );
            }

            // Показываем раскрытую характеристику
            return (
              <div key={key} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '3px',
                animation: isRevealed && hideChars ? 'fadeIn 0.5s ease' : 'none'
              }}>
                <span>{characteristicIcons[key] || '📊'} {characteristicNames[key]}:</span>
                <span style={{
                  color: value === 'high' ? '#27ae60' : '#e74c3c',
                  fontWeight: 'bold',
                  backgroundColor: value === 'high' ? '#e8f5e9' : '#ffebee',
                  padding: '0 6px',
                  borderRadius: '4px'
                }}>
                  {value === 'high' ? '⬆️ Высокая' : '⬇️ Низкая'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {card.description && type !== 'attack' && type !== 'defense' && (
        <p style={{ fontSize: '10px', color: '#95a5a6', marginTop: '8px', marginBottom: '0', fontStyle: 'italic' }}>
          {card.description}
        </p>
      )}
    </div>
  );
}