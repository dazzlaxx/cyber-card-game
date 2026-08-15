// КОЛОДА КАРТ ЗАЩИТЫ

const temporaryCards = [
  { id: 'd1', name: 'Антивирусное обновление', type: 'defense', characteristic: 'informationSecurity', duration: 'temporary', description: 'Экстренное обновление антивирусных баз для защиты от новых фишинговых атак и вредоносного ПО.' },
  { id: 'd2', name: 'SIEM-мониторинг', type: 'defense', characteristic: 'informationSecurity', duration: 'temporary', description: 'Временное усиление системы мониторинга событий безопасности для выявления атак в реальном времени.' },
  { id: 'd3', name: 'Шифрование данных', type: 'defense', characteristic: 'informationSecurity', duration: 'temporary', description: 'Экстренное шифрование критических данных для предотвращения их утечки при взломе.' },
  { id: 'd4', name: 'Брандмауэрная защита', type: 'defense', characteristic: 'informationSecurity', duration: 'temporary', description: 'Усиление сетевого экрана для блокировки подозрительного трафика и вторжений.' },
  { id: 'd5', name: '2FA-аутентификация', type: 'defense', characteristic: 'informationSecurity', duration: 'temporary', description: 'Внедрение двухфакторной аутентификации для всех сотрудников на один ход.' },
  { id: 'd6', name: 'Резервный сервер', type: 'defense', characteristic: 'technologyInfrastructure', duration: 'temporary', description: 'Активация резервного сервера для распределения нагрузки при DDoS-атаках.' },
  { id: 'd7', name: 'Балансировщик нагрузки', type: 'defense', characteristic: 'technologyInfrastructure', duration: 'temporary', description: 'Временная настройка балансировки для оптимизации работы инфраструктуры.' },
  { id: 'd8', name: 'Кэширование контента', type: 'defense', characteristic: 'technologyInfrastructure', duration: 'temporary', description: 'Ускорение работы сайта через кэширование для снижения нагрузки на серверы.' },
  { id: 'd9', name: 'CDN-сеть', type: 'defense', characteristic: 'technologyInfrastructure', duration: 'temporary', description: 'Подключение к сети доставки контента для защиты от географических атак.' },
  { id: 'd10', name: 'План восстановления', type: 'defense', characteristic: 'technologyInfrastructure', duration: 'temporary', description: 'Активация временного плана восстановления после сбоев в инфраструктуре.' },
  { id: 'd11', name: 'Срочный кредит', type: 'defense', characteristic: 'financialStability', duration: 'temporary', description: 'Экстренное привлечение кредитных средств для покрытия убытков от атаки.' },
  { id: 'd12', name: 'Инвестиционный раунд', type: 'defense', characteristic: 'financialStability', duration: 'temporary', description: 'Временное привлечение инвестиций для укрепления финансовой подушки.' },
  { id: 'd13', name: 'Финансовый резерв', type: 'defense', characteristic: 'financialStability', duration: 'temporary', description: 'Использование неприкосновенного запаса для покрытия непредвиденных расходов.' },
  { id: 'd14', name: 'Страховой полис', type: 'defense', characteristic: 'financialStability', duration: 'temporary', description: 'Активация страхового покрытия для компенсации ущерба от кибератак.' },
  { id: 'd15', name: 'Ликвидность активов', type: 'defense', characteristic: 'financialStability', duration: 'temporary', description: 'Быстрая конвертация активов в денежные средства для обеспечения платежей.' },
  { id: 'd16', name: 'Хакатон решений', type: 'defense', characteristic: 'innovationAbility', duration: 'temporary', description: 'Срочный сбор идей от сотрудников для поиска нестандартных решений проблемы.' },
  { id: 'd17', name: 'Экспертный совет', type: 'defense', characteristic: 'innovationAbility', duration: 'temporary', description: 'Привлечение внешних экспертов для консультации по инновационным решениям.' },
  { id: 'd18', name: 'Краудсорсинг идей', type: 'defense', characteristic: 'innovationAbility', duration: 'temporary', description: 'Открытый сбор идей от сообщества для решения технологических проблем.' },
  { id: 'd19', name: 'Стартап-акселератор', type: 'defense', characteristic: 'innovationAbility', duration: 'temporary', description: 'Временное ускорение разработки инновационных продуктов для опережения угроз.' },
  { id: 'd20', name: 'Патентная защита', type: 'defense', characteristic: 'innovationAbility', duration: 'temporary', description: 'Срочное патентование разработок для защиты интеллектуальной собственности.' },
  { id: 'd21', name: 'Пиар-кампания', type: 'defense', characteristic: 'reputation', duration: 'temporary', description: 'Экстренная PR-кампания для восстановления доверия после информационной атаки.' },
  { id: 'd22', name: 'Публичное извинение', type: 'defense', characteristic: 'reputation', duration: 'temporary', description: 'Открытое обращение к клиентам с извинениями и планом исправления ситуации.' },
  { id: 'd23', name: 'Кризис-менеджер', type: 'defense', characteristic: 'reputation', duration: 'temporary', description: 'Найм антикризисного менеджера для управления репутационными рисками.' },
  { id: 'd24', name: 'Социальная реклама', type: 'defense', characteristic: 'reputation', duration: 'temporary', description: 'Размещение социальной рекламы для улучшения имиджа компании.' },
  { id: 'd25', name: 'Работа с блогерами', type: 'defense', characteristic: 'reputation', duration: 'temporary', description: 'Привлечение блогеров для создания позитивного контента о компании.' }
];

const permanentCards = [
  { id: 'p1', name: 'ISO 27001 Сертификация', type: 'defense', characteristic: 'informationSecurity', duration: 'permanent', description: 'Международный стандарт управления информационной безопасностью, действует до первого взлома.' },
  { id: 'p2', name: 'SOC-центр', type: 'defense', characteristic: 'informationSecurity', duration: 'permanent', description: 'Круглосуточный центр мониторинга и реагирования на инциденты безопасности.' },
  { id: 'p3', name: 'Облачная инфраструктура', type: 'defense', characteristic: 'technologyInfrastructure', duration: 'permanent', description: 'Отказоустойчивая облачная архитектура с автоматическим восстановлением.' },
  { id: 'p4', name: 'DRP-план', type: 'defense', characteristic: 'technologyInfrastructure', duration: 'permanent', description: 'Постоянный план восстановления после катастроф с регулярными тестированиями.' },
  { id: 'p5', name: 'Хедж-фонд', type: 'defense', characteristic: 'financialStability', duration: 'permanent', description: 'Специализированный фонд для страхования финансовых рисков от кибератак.' },
  { id: 'p6', name: 'Финансовый аудит', type: 'defense', characteristic: 'financialStability', duration: 'permanent', description: 'Постоянный контроль финансовых операций для выявления мошенничества.' },
  { id: 'p7', name: 'R&D Центр', type: 'defense', characteristic: 'innovationAbility', duration: 'permanent', description: 'Собственная лаборатория разработки инновационных решений для защиты.' },
  { id: 'p8', name: 'Патентный портфель', type: 'defense', characteristic: 'innovationAbility', duration: 'permanent', description: 'Обширный портфель патентов, защищающий интеллектуальную собственность.' },
  { id: 'p9', name: 'ESG-программа', type: 'defense', characteristic: 'reputation', duration: 'permanent', description: 'Программа устойчивого развития, укрепляющая репутацию компании.' },
  { id: 'p10', name: 'Совет директоров', type: 'defense', characteristic: 'reputation', duration: 'permanent', description: 'Наблюдательный совет, контролирующий соблюдение стандартов и репутацию.' }
];

export const defenseCards = {
  temporary: temporaryCards,
  permanent: permanentCards
};