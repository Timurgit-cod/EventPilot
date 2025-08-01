# Руководство по ручной загрузке на GitHub

## Ваш репозиторий: https://github.com/Timurgit-cod/business-calendar

### Шаг 1: Очистка репозитория (если нужно)
1. Перейдите в ваш репозиторий: https://github.com/Timurgit-cod/business-calendar
2. Если в нем есть файлы, удалите их или создайте новый репозиторий

### Шаг 2: Загрузка файлов

**Способ A: Через веб-интерфейс**
1. Нажмите "uploading an existing file" на главной странице репозитория
2. Перетащите следующие файлы из вашего Replit проекта:

**Основные файлы проекта:**
- `package.json`
- `package-lock.json` 
- `tsconfig.json`
- `vite.config.ts`
- `tailwind.config.ts`
- `postcss.config.js`
- `drizzle.config.ts`
- `components.json`

**Документация:**
- `README.md`
- `DEPLOY.md`
- `.env.example`
- `.gitignore`

**Папки (создать и загрузить содержимое):**
- `client/` (вся папка)
- `server/` (вся папка)  
- `shared/` (вся папка)

### Шаг 3: Структура которая должна получиться

```
business-calendar/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   └── index.html
├── server/
│   ├── index.ts
│   ├── routes.ts
│   ├── storage.ts
│   ├── db.ts
│   └── replitAuth.ts
├── shared/
│   └── schema.ts
├── README.md
├── DEPLOY.md
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── drizzle.config.ts
└── components.json
```

### Шаг 4: Commit message
Используйте сообщение: `Event Calendar Application - полнофункциональная система календаря с ролевым доступом`

### Важно НЕ загружать:
- `node_modules/` (будет создана автоматически)
- `.git/` (создается автоматически)
- `dist/` (создается при сборке)
- Временные файлы

### После загрузки:
1. Проверьте что все файлы на месте
2. Настройте переменные окружения согласно `.env.example`
3. Разверните на платформе (Vercel, Railway, Render)