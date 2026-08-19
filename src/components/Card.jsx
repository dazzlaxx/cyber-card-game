// ============================================================
// КОМПОНЕНТ КАРТЫ
// ============================================================

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

  const getCharacteristicValue = (value) => {
    if (value === 'high') return '⬆️ Высокая';
    if (value === 'low') return '⬇️ Низкая';
    return value;
  };

  const getCharacteristicColor = (value) => {
    if (value === 'high') return '#27ae60';
    if (value === 'low') return '#e74c3c';
    return '#95a5a6';
  };

  const getCharacteristicBg = (value) => {
    if (value === 'high') return '#e8f5e9';
    if (value === 'low') return '#ffebee';
    return '#f5f5f5';
  };

  // Проверяем, защищена ли характеристика
  const isCharacteristicDefended = (company, characteristic) => {
    if (type !== 'company') return false;
    const permanentDefenses = company.permanentDefenses || [];
    const temporaryDefenses = company.temporaryDefenses || [];
    return permanentDefenses.some(d => d?.characteristic === characteristic) ||
           temporaryDefenses.some(d => d?.characteristic === characteristic);
  };

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
            const isRevealed = !card.hideCharacteristics ||
                              (card.revealedCharacteristics && card.revealedCharacteristics.includes(key));

            // Проверяем, защищена ли характеристика
            const defended = isCharacteristicDefended(card, key);
            const defenseType = card.permanentDefenses?.some(d => d?.characteristic === key) ? '🛡️ Постоянная' :
                               card.temporaryDefenses?.some(d => d?.characteristic === key) ? '🛡️ Временная' : '';

            if (card.hideCharacteristics && !isRevealed) {
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

            return (
              <div key={key} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '3px',
                alignItems: 'center',
                animation: card.hideCharacteristics && isRevealed ? 'fadeIn 0.5s ease' : 'none'
              }}>
                <span>
                  {characteristicIcons[key] || '📊'} {characteristicNames[key]}:
                  {defended && (
                    <span style={{ 
                      marginLeft: '4px',
                      fontSize: '11px',
                      color: '#f39c12',
                      fontWeight: 'bold'
                    }}>
                      {defenseType}
                    </span>
                  )}
                </span>
                <span style={{
                  color: getCharacteristicColor(value),
                  fontWeight: 'bold',
                  backgroundColor: getCharacteristicBg(value),
                  padding: '0 6px',
                  borderRadius: '4px'
                }}>
                  {getCharacteristicValue(value)}
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