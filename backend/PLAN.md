## План по интеграции файловых операций

### Фаза 1: Подготовка и начальная миграция

1.  **Изучение существующих инструментов файловой системы:**
    - Изучить `servers/src/filesystem/index.ts`, чтобы понять, как регистрируются и используются инструменты.
    - Изучить `servers/src/filesystem/lib.ts`, чтобы увидеть фактическую реализацию файловых операций (чтение, запись, и т.д.).
    - Изучить `servers/src/filesystem/path-utils.ts`, `servers/src/filesystem/path-validation.ts` и `servers/src/filesystem/roots-utils.ts` для утилит.

2.  **Создание новой директории в `backend`:**
    - Создать директорию `/Users/danylolepetynskyi/Desktop/LocalLLM/backend/src/filesystem/` для размещения перенесенных файлов.

3.  **Копирование основной логики файловой системы:**
    - Скопировать `servers/src/filesystem/lib.ts`, `servers/src/filesystem/path-utils.ts`, `servers/src/filesystem/path-validation.ts` и `servers/src/filesystem/roots-utils.ts` в `/Users/danylolepetynskyi/Desktop/LocalLLM/backend/src/filesystem/`.
    - Скорректировать импорты внутри этих скопированных файлов, чтобы они отражали их новое расположение.

### Фаза 2: Адаптация для NestJS

1.  **Создание `FilesystemModule` и `FilesystemService`:**
    - Создать `/Users/danylolepetynskyi/Desktop/LocalLLM/backend/src/filesystem/filesystem.module.ts` и `/Users/danylolepetynskyi/Desktop/LocalLLM/backend/src/filesystem/filesystem.service.ts`.
    - `FilesystemService` будет инкапсулировать логику файловых операций.

2.  **Рефакторинг инструментов из `index.ts` в `FilesystemService`:**
    - `servers/src/filesystem/index.ts` содержит определения и обработчики инструментов. Эти обработчики напрямую вызывают функции из `lib.ts`.
    - Создать методы в `FilesystemService`, соответствующие каждому инструменту (например, `readTextFile`, `writeFile`, `listDirectory` и т.д.).
    - Эти методы будут обертывать базовые функции, импортированные из `backend/src/filesystem/lib.ts`.
    - Обработать `zod` схемы при необходимости, потенциально преобразуя их в DTO или проверяя входные данные непосредственно в методах сервиса.

3.  **Обработка `allowedDirectories`:**
    - `servers/src/filesystem/index.ts` управляет `allowedDirectories`. Эта логика должна быть интегрирована в `FilesystemService` или службу конфигурации. Для простоты, мы можем изначально жестко задать корневую директорию рабочего пространства как разрешенную директорию или сделать ее настраиваемой через `ConfigService`.

### Фаза 3: Интеграция в `FileOperationHandlerService`

1.  **Внедрение `FilesystemService`:**
    - Изменить `/Users/danylolepetynskyi/Desktop/LocalLLM/backend/src/llm/modules/file-operation-handler.service.ts` для внедрения `FilesystemService`.

2.  **Замена генерации вызовов инструментов:**
    - Вместо использования `generateObject` с `ollama("deepseek-r1:8b")` для классификации `LlmAction`, а затем вызова `llmActionService.executeLlmAction`, `FileOperationHandlerService` будет напрямую вызывать методы `FilesystemService` на основе запроса пользователя.
    - Это означает, что классификация намерений (например, "list", "read", "write", "delete") все еще будет необходима, но выполнение изменится. Часть `z.enum(["list", "read", "write", "delete"])` из `generateObject` по-прежнему актуальна для определения _типа_ файловой операции.

3.  **Обновление `LlmActionService` (при необходимости):**
    - Если `LlmActionService` больше не нужен для выполнения файловых операций, его можно удалить или рефакторить. Мы примем это решение во время реализации.

### Фаза 4: Тестирование и доработка

1.  **Модульные тесты:**
    - Написать модульные тесты для `FilesystemService`, чтобы убедиться, что все файловые операции работают должным образом.
    - Обновить существующие тесты или создать новые для `FileOperationHandlerService`.

2.  **Интеграционные тесты:**
    - Проверить сквозной поток от `LlmService` через `FileOperationHandlerService` к новому `FilesystemService`.
