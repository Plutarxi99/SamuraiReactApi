# Samurai Social API

REST API социальной сети, построенный на NestJS 11 с TypeScript. Поддерживает аутентификацию, профили пользователей, посты, диалоги и личные сообщения.

## Технологии

- **Framework**: NestJS 11 + TypeScript
- **Database**: SQLite (better-sqlite3) + TypeORM
- **Auth**: JWT (Passport.js) + bcrypt
- **Docs**: Swagger UI + ReDoc
- **Validation**: class-validator + class-transformer
- **File Upload**: Multer (аватары)

## Быстрый старт

```bash
npm install
npm run start:dev
```

Сервер запустится на `http://localhost:3000`.

## Переменные окружения

| Переменная  | По умолчанию                  | Описание             |
|-------------|-------------------------------|----------------------|
| `PORT`      | `3000`                        | Порт сервера         |
| `JWT_SECRET`| `dev-secret-change-in-prod`   | Секрет для JWT токенов |
| `NODE_ENV`  | —                             | `production` отключает auto-sync БД |

Создайте файл `.env` в корне проекта:

```env
PORT=3000
JWT_SECRET=your-secret-key
NODE_ENV=development
```

## Документация API

После запуска сервера доступны:

| URL | Описание |
|-----|----------|
| `http://localhost:3000/api/docs` | Swagger UI (интерактивный) |
| `http://localhost:3000/api/docs/redoc` | ReDoc (справочник) |
| `http://localhost:3000/api/docs-json` | OpenAPI JSON спецификация |

### Авторизация в Swagger UI

1. `POST /api/auth/login` → скопировать `accessToken`
2. Нажать кнопку **Authorize** (вверху справа)
3. Ввести `Bearer <токен>` → **Authorize**

## Эндпоинты

### Auth

| Метод | URL | Auth | Описание |
|-------|-----|------|----------|
| POST | `/api/auth/register` | — | Регистрация |
| POST | `/api/auth/login` | — | Вход |
| GET | `/api/auth/me` | JWT | Текущий пользователь |

### Users

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/users` | Список пользователей (пагинация) |
| GET | `/api/users/:id` | Профиль пользователя |
| POST | `/api/users/me/photo` | Загрузить аватар |
| POST | `/api/users/:id/follow` | Подписаться |
| DELETE | `/api/users/:id/follow` | Отписаться |
| POST | `/api/users/:id/block` | Заблокировать |

> Все эндпоинты Users требуют JWT.

### Posts

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/posts?userId=` | Посты пользователя (свои, если `userId` не указан) |
| POST | `/api/posts` | Создать пост |

### Dialogs

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/dialogs` | Список диалогов |
| GET | `/api/dialogs/:id/messages` | Сообщения диалога |
| POST | `/api/dialogs/:id/messages` | Отправить сообщение |

## Структура проекта

```
src/
├── auth/               # JWT-аутентификация
├── users/              # Пользователи, подписки, блокировки, аватары
├── posts/              # Посты
├── dialogs/            # Диалоги и сообщения
└── database/
    ├── entities/       # TypeORM-сущности
    └── data-source.ts  # Конфигурация TypeORM
```

## Загрузка аватара

- **Endpoint**: `POST /api/users/me/photo` (multipart/form-data, поле `photo`)
- **Разрешённые форматы**: JPEG, PNG, GIF, WEBP
- **Максимальный размер**: 5 MB
- **Расположение**: `./uploads/avatars/`
- **URL файла**: `http://localhost:3000/api/uploads/avatars/<filename>`

## Команды

```bash
# Разработка
npm run start:dev       # Watch-режим
npm run start:debug     # С отладчиком

# Production
npm run build
npm run start:prod

# Тесты
npm run test            # Unit-тесты
npm run test:e2e        # E2E-тесты
npm run test:cov        # Покрытие

# Миграции БД
npm run migration:generate
npm run migration:run
npm run migration:revert

# Линтинг
npm run lint
npm run format
```

## Миграции (Production)

В режиме `NODE_ENV=production` автоматическая синхронизация схемы БД отключена. Используйте миграции:

```bash
NODE_ENV=production npm run migration:generate -- -n MigrationName
NODE_ENV=production npm run migration:run
```
