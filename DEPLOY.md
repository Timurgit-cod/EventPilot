# Инструкции по развертыванию на GitHub

## Шаг 1: Подготовка Git репозитория

1. Инициализируйте Git репозиторий (если еще не сделано):
```bash
git init
```

2. Добавьте все файлы в индекс:
```bash
git add .
```

3. Создайте первый коммит:
```bash
git commit -m "Initial commit: Event Calendar Application"
```

## Шаг 2: Создание GitHub репозитория

1. Перейдите на [GitHub.com](https://github.com)
2. Нажмите "New repository" (зеленая кнопка)
3. Заполните форму:
   - **Repository name**: `event-calendar` (или любое другое имя)
   - **Description**: `Event Calendar Application with role-based access`
   - **Visibility**: Public или Private (на ваш выбор)
   - **НЕ отмечайте**: "Add a README file", "Add .gitignore", "Choose a license"

4. Нажмите "Create repository"

## Шаг 3: Подключение к GitHub

1. Скопируйте URL вашего репозитория (будет показан на странице)

2. Добавьте удаленный репозиторий:
```bash
git remote add origin YOUR_REPOSITORY_URL
```

Пример:
```bash
git remote add origin https://github.com/yourusername/event-calendar.git
```

3. Отправьте код на GitHub:
```bash
git branch -M main
git push -u origin main
```

## Шаг 4: Настройка для развертывания

### Переменные окружения для production

Создайте файл `.env.example`:
```
DATABASE_URL=postgresql://username:password@host:port/database
SESSION_SECRET=your-very-long-random-secret-key
REPL_ID=your-repl-identifier
ISSUER_URL=your-openid-connect-issuer-url
NODE_ENV=production
PORT=5000
```

### GitHub Actions (опционально)

Для автоматического CI/CD можете создать `.github/workflows/deploy.yml`

## Шаг 5: Развертывание на платформах

### На Vercel
1. Перейдите на [vercel.com](https://vercel.com)
2. Подключите ваш GitHub репозиторий
3. Настройте переменные окружения
4. Деплой произойдет автоматически

### На Railway
1. Перейдите на [railway.app](https://railway.app)
2. Подключите GitHub репозиторий
3. Настройте PostgreSQL базу данных
4. Добавьте переменные окружения

### На Render
1. Перейдите на [render.com](https://render.com)
2. Создайте новый Web Service
3. Подключите GitHub репозиторий
4. Настройте переменные окружения

## Важные заметки

- **База данных**: Убедитесь, что у вас есть PostgreSQL база данных
- **Миграции**: После развертывания выполните `npm run db:push`
- **Переменные окружения**: Никогда не коммитьте реальные секреты в репозиторий
- **Первый пользователь**: Первый зарегистрированный пользователь станет администратором

## Обновление кода

После внесения изменений:

```bash
git add .
git commit -m "Описание изменений"
git push origin main
```

Развертывание произойдет автоматически (зависит от платформы).