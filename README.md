# calc-server

Node.js HTTP-сервер для расчёта торговых предложений (ТП) на основе движка калькуляции из [prospektweb/calcconfig](https://github.com/prospektweb/calcconfig).

## Описание

Этот сервер позволяет выполнять серверные расчёты ТП без необходимости запуска браузера. Используется для автоматического пересчёта при изменении цен материалов, обновлении параметров и других сценариев массовой калькуляции.

## Возможности

- **HTTP API** для расчёта торговых предложений
- **Полная совместимость** с движком калькуляции из calcconfig
- **Поддержка LOGIC_JSON** — динамические формулы и логика расчётов
- **IP-фильтрация** для ограничения доступа
- **Docker-ready** — простое развёртывание

## Требования

- Node.js >= 20.0.0
- npm >= 9.0.0

## Установка

### С помощью npm

```bash
# Клонировать репозиторий
git clone https://github.com/prospektweb/calc-server.git
cd calc-server

# Установить зависимости
npm install

# Создать файл конфигурации
cp .env.example .env

# Настроить переменные окружения в .env
nano .env
```

### С помощью Docker

```bash
# Клонировать репозиторий
git clone https://github.com/prospektweb/calc-server.git
cd calc-server

# Создать файл конфигурации
cp .env.example .env

# Настроить переменные окружения в .env
nano .env

# Собрать и запустить
docker-compose up -d
```

## Конфигурация

Настройки задаются через переменные окружения в файле `.env`:

```env
# Порт сервера (по умолчанию 3100)
PORT=3100

# IP-адреса с доступом (через запятую, пустое значение = все адреса)
ALLOWED_IPS=127.0.0.1,10.0.0.1

# Уровень логирования: debug, info, warn, error (по умолчанию info)
LOG_LEVEL=info

# Окружение: development или production
NODE_ENV=production

# CORS origin (опционально, пустое значение = все origins)
CORS_ORIGIN=
```

### IP-фильтрация

- Если `ALLOWED_IPS` пустой или не задан — доступ разрешён всем (режим разработки)
- Если `ALLOWED_IPS` задан — доступ только с указанных IP-адресов
- Поддерживаются IPv4 адреса и заголовок `x-forwarded-for` для проксированных запросов

## Запуск

### Режим разработки (с hot-reload)

```bash
npm run dev
```

### Режим production

```bash
# Сборка TypeScript
npm run build

# Запуск
npm start
```

### Docker

```bash
# Запуск
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановка
docker-compose down
```

## API

### Healthcheck

**GET** `/health`

Проверка работоспособности сервера.

**Ответ:**

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 123.456
}
```

### Расчёт торговых предложений

**POST** `/calculate`

Выполняет расчёт одного или нескольких торговых предложений.

**Тело запроса:**

```json
{
  "initPayload": {
    "elementsStore": {
      "CALC_DETAILS": [...],
      "CALC_STAGES": [...],
      "CALC_SETTINGS": [...],
      ...
    },
    "selectedOffers": [
      {
        "id": 123,
        "name": "Название ТП",
        "productId": 456,
        "properties": {...}
      }
    ],
    "product": {
      "id": 456,
      "name": "Название продукта"
    },
    "preset": {
      "id": 789,
      "name": "Название пресета",
      "prices": [...]
    },
    "priceTypes": [
      {
        "id": 1,
        "name": "Базовая цена",
        "base": true,
        "sort": 100
      }
    ],
    "iblocks": [...],
    "elementsSiblings": [...],
    "context": {...}
  }
}
```

**Успешный ответ:**

```json
{
  "success": true,
  "data": [
    {
      "offerId": 123,
      "offerName": "Название ТП",
      "productId": 456,
      "productName": "Название продукта",
      "presetId": 789,
      "presetName": "Название пресета",
      "details": [...],
      "directPurchasePrice": 1000,
      "purchasePrice": 1200,
      "currency": "RUB",
      "parametrValues": [...],
      "priceRangesWithMarkup": [...]
    }
  ],
  "timing": {
    "startedAt": "2024-01-15T10:30:00.000Z",
    "completedAt": "2024-01-15T10:30:05.123Z",
    "durationMs": 5123
  }
}
```

**Ошибка:**

```json
{
  "success": false,
  "error": "Описание ошибки",
  "timing": {
    "startedAt": "2024-01-15T10:30:00.000Z",
    "completedAt": "2024-01-15T10:30:01.000Z",
    "durationMs": 1000
  }
}
```

### Пример запроса (curl)

```bash
curl -X POST http://localhost:3100/calculate \
  -H "Content-Type: application/json" \
  -d @payload.json
```

Где `payload.json` содержит полный `initPayload` с данными для расчёта.

## Архитектура

```
calc-server/
├── src/
│   ├── server.ts                           # Express HTTP-сервер
│   ├── routes/
│   │   └── calculate.ts                    # POST /calculate endpoint
│   ├── services/
│   │   ├── calculationEngine.ts            # Движок калькуляции (адаптирован из calcconfig)
│   │   └── calculationLogicProcessor.ts    # Обработка LOGIC_JSON (адаптирован из calcconfig)
│   ├── lib/
│   │   ├── types.ts                        # Типы данных
│   │   ├── stage-utils.ts                  # Утилиты для этапов
│   │   └── bitrix-to-ui-transformer.ts     # Трансформация данных Bitrix
│   ├── middleware/
│   │   └── ipFilter.ts                     # IP-фильтрация
│   └── utils/
│       └── logger.ts                       # Логгер
├── Dockerfile                              # Docker-образ
├── docker-compose.yml                      # Docker Compose конфигурация
├── package.json                            # npm-зависимости
├── tsconfig.json                           # TypeScript конфигурация
├── .env.example                            # Пример переменных окружения
└── README.md                               # Документация
```

## Ключевые компоненты

### calculationEngine.ts

Ядро системы расчётов. Содержит функции:

- `calculateStage()` — расчёт одного этапа
- `calculateDetail()` — расчёт детали со всеми её этапами
- `calculateBinding()` — расчёт группы скрепления (рекурсивно)
- `calculateOffer()` — расчёт одного торгового предложения
- `calculateAllOffers()` — расчёт всех ТП

### calculationLogicProcessor.ts

Обработка динамических формул из LOGIC_JSON:

- Извлечение PARAMS, INPUTS, OUTPUTS
- Парсинг и вычисление формул
- Поддержка встроенных функций: `get`, `ceil`, `floor`, `max`, `min`, `if`, `round`, `getPrice` и др.
- Безопасный tokenizer и AST-parser для формул

### bitrix-to-ui-transformer.ts

Преобразование данных из формата Bitrix (elementsStore) в формат для калькуляции (Details, Bindings).

## Логирование

Уровень логирования задаётся через `LOG_LEVEL`:

- `debug` — максимально подробные логи (включая контексты и промежуточные результаты)
- `info` — стандартные логи работы сервера
- `warn` — предупреждения
- `error` — только ошибки

## Безопасность

1. **IP-фильтрация** — ограничение доступа по IP-адресам
2. **CORS** — настраиваемый CORS origin
3. **Лимит размера запроса** — 50MB для больших initPayload
4. **Graceful shutdown** — корректное завершение при SIGTERM/SIGINT

## Troubleshooting

### Проблема: "Access denied" (403)

Проверьте, что IP-адрес клиента указан в `ALLOWED_IPS` или очистите эту переменную для режима разработки.

### Проблема: "Missing initPayload"

Убедитесь, что запрос содержит правильный JSON с полем `initPayload`.

### Проблема: Расчёты возвращают нулевые цены

Проверьте, что:
- `elementsStore` содержит все необходимые данные (CALC_SETTINGS, CALC_STAGES, варианты)
- LOGIC_JSON корректно заполнен в CALC_SETTINGS
- INPUTS и OUTPUTS правильно настроены в CALC_STAGES

## Разработка

### Структура проекта

- `src/lib/` — типы и утилиты
- `src/services/` — бизнес-логика расчётов
- `src/middleware/` — Express middleware
- `src/routes/` — обработчики endpoints
- `src/utils/` — вспомогательные утилиты

### Расширение функциональности

Для добавления новых endpoints:

1. Создать обработчик в `src/routes/`
2. Зарегистрировать маршрут в `src/server.ts`
3. При необходимости добавить middleware

## Лицензия

ISC

## Автор

prospektweb

## Ссылки

- [prospektweb/calcconfig](https://github.com/prospektweb/calcconfig) — фронтенд-калькулятор
- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [TypeScript](https://www.typescriptlang.org/)
