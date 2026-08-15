// КОЛОДА КАРТ АТАКИ
// === ОДИНОЧНЫЕ АТАКИ (10 карт) ===
const singleAttackCards = [
  { id: 'a1', name: 'Фишинговая атака', type: 'single', characteristics: ['informationSecurity'], damage: 1, description: 'Обманные письма, которые выманивают у сотрудников логины и пароли от рабочих аккаунтов.' },
  { id: 'a2', name: 'Утечка данных', type: 'single', characteristics: ['informationSecurity'], damage: 1, description: 'Случайное или намеренное копирование секретных баз данных компании во внешний интернет.' },
  { id: 'a3', name: 'DDoS-атака', type: 'single', characteristics: ['technologyInfrastructure'], damage: 1, description: 'Лавина ложных запросов, которая полностью парализует работу сайта и внутренних серверов.' },
  { id: 'a4', name: 'Сбой legacy-кода', type: 'single', characteristics: ['technologyInfrastructure'], damage: 1, description: 'Атака на устаревшее ПО, которое компания вовремя не обновила, вызвавшая в итоге отказ систем.' },
  { id: 'a5', name: 'Программы-вымогатели', type: 'single', characteristics: ['financialStability'], damage: 1, description: 'Вирус шифрует все файлы компании и требует огромный выкуп в биткоинах.' },
  { id: 'a6', name: 'CEO-мошенничество', type: 'single', characteristics: ['financialStability'], damage: 1, description: 'Письмо от лица директора с требованием срочно перевести деньги "секретному контрагенту".' },
  { id: 'a7', name: 'Промышленный шпионаж', type: 'single', characteristics: ['innovationAbility'], damage: 1, description: 'Хакеры воруют чертежи или код нового продукта, лишая компанию уникального преимущества.' },
  { id: 'a8', name: 'Кража патента', type: 'single', characteristics: ['innovationAbility'], damage: 1, description: 'Кража чертежей до подачи заявки, чтобы зарегистрировать технологию на подставную фирму.' },
  { id: 'a9', name: 'Дефейс сайта', type: 'single', characteristics: ['reputation'], damage: 1, description: 'Взлом главной страницы сайта с заменой контента на оскорбительный или компрометирующий.' },
  { id: 'a10', name: 'Атака ботов-отзывов', type: 'single', characteristics: ['reputation'], damage: 1, description: 'Наводнение страниц компании тысячами фейковых негативных отзывов от ботов.' }
];

// === ДВОЙНЫЕ АТАКИ (по 1 на каждую уникальную пару = 10 карт) ===
const doubleAttackCards = [
  { id: 'a11', name: 'Руткиты в ядре системы', type: 'double', characteristics: ['informationSecurity', 'technologyInfrastructure'], damage: 2, description: 'Глубокое заражение ядра системы, скрывающее вирус от антивирусов и дающее полный контроль над сетью.' },
  { id: 'a12', name: 'Скимминг платежных данных', type: 'double', characteristics: ['informationSecurity', 'financialStability'], damage: 2, description: 'Считывание данных банковских карт клиентов прямо с терминалов или через взломанные формы оплаты.' },
  { id: 'a13', name: 'Отравление данных ИИ', type: 'double', characteristics: ['informationSecurity', 'innovationAbility'], damage: 2, description: 'Незаметное изменение обучающих данных нейросети, из-за чего ИИ начинает выдавать ошибки.' },
  { id: 'a14', name: 'Доксинг руководства', type: 'double', characteristics: ['informationSecurity', 'reputation'], damage: 2, description: 'Слив в открытый доступ личной переписки, фото и документов руководства компании.' },
  { id: 'a15', name: 'Уничтожение бэкапов', type: 'double', characteristics: ['technologyInfrastructure', 'financialStability'], damage: 2, description: 'Целенаправленное уничтожение резервных копий, требующее огромных затрат на восстановление с нуля.' },
  { id: 'a16', name: 'Саботаж обновлений', type: 'double', characteristics: ['technologyInfrastructure', 'innovationAbility'], damage: 2, description: 'Подмена файла официального обновления ПО на вирус, блокирующий выпуск новых технологических патчей.' },
  { id: 'a17', name: 'Перехват DNS-запросов', type: 'double', characteristics: ['technologyInfrastructure', 'reputation'], damage: 2, description: 'Изменение маршрутов интернета, из-за чего пользователи вместо сайта компании попадают на фишинговый ресурс.' },
  { id: 'a18', name: 'Подкуп разработчиков', type: 'double', characteristics: ['financialStability', 'innovationAbility'], damage: 2, description: 'Подкуп или взлом разработчиков с целью продажи прототипов прямым конкурентам.' },
  { id: 'a19', name: 'Манипуляция акциями', type: 'double', characteristics: ['financialStability', 'reputation'], damage: 2, description: 'Вброс скоординированной дезинформации о взломе компании, вызывающий панику на бирже и обвал стоимости активов.' },
  { id: 'a20', name: 'Фейковый релиз продукта', type: 'double', characteristics: ['innovationAbility', 'reputation'], damage: 2, description: 'Публикация фальшивого анонса о "провальных" технологиях компании, созданная с помощью дипфэйков.' }
];

// === КАРТЫ С ВЫБОРОМ ХАРАКТЕРИСТИКИ (3 карты) ===
const chooseCards = [
  { id: 'a21', name: 'Точечный эксплойт', type: 'choose', characteristics: [], damage: 1, description: 'Выберите характеристику для атаки - найдите уязвимость самостоятельно!' },
  { id: 'a22', name: 'Социальная инженерия', type: 'choose', characteristics: [], damage: 1, description: 'Обманите сотрудников - выберите характеристику, которую они не защитили!' },
  { id: 'a23', name: 'Нулевой день', type: 'choose', characteristics: [], damage: 1, description: 'Используйте неизвестную уязвимость - выберите цель для атаки!' }
];

export const attackCards = [...singleAttackCards, ...doubleAttackCards, ...chooseCards];