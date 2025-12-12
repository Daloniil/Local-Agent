# Local AI File Assistant

This project consists of a React frontend and a NestJS backend, designed to provide a local AI file assistant with GUI.

## Getting Started

1.  **Project Initialization (Manual Steps):**

    First, ensure you have Node.js and npm installed. Then, from the project root (`LocalLLM/`), execute the following commands:

    **For Backend (NestJS):**

    ```bash
    cd backend
    npm init -y
    npm install @nestjs/core @nestjs/common @nestjs/platform-express reflect-metadata rxjs axios @nestjs/config pino winston class-validator class-transformer @nestjs/axios
    npm install -D @nestjs/cli @nestjs/schematics @nestjs/testing @types/express @types/jest @types/node @types/supertest @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint eslint-config-prettier eslint-plugin-prettier jest prettier source-map-support supertest ts-jest ts-loader ts-node tsconfig-paths typescript
    # If 'nest new .' fails, you might need to create a basic tsconfig.json manually
    # nest new . --skip-git --package-manager npm # Attempt this, if it fails, continue with manual file creation
    ```

    **For Frontend (Vite React):**

    ```bash
    cd frontend
    npm create vite@latest . -- --template react-ts
    npm install axios react-router-dom
    ```

2.  **Configure Environment Variables:**

    Create a `.env` file in the `backend/` directory with the following variables:

    ```env
    API_TOKEN=your_strong_api_token_here
    ALLOWED_ROOTS=/Users/danylolepetynskyi/Desktop/LocalLLM/ai_access,/Users/danylolepetynskyi/Desktop/LocalLLM/task
    ALLOW_WRITE=false
    ALLOW_DELETE=false
    LLM_ENDPOINT=http://localhost:11434/api/generate
    PORT=3001
    MAX_FILE_SIZE_MB=2
    LOG_LEVEL=info
    ```

    Also, create a `.env` file in the `frontend/` directory:

    ```env
    VITE_API_TOKEN=your_strong_api_token_here
    ```

    (The `API_TOKEN` and `VITE_API_TOKEN` should match).

3.  **Run the Application:**

    - **Start Backend:** In the `backend/` directory, run:

      ```bash
      npm run start:dev
      ```

      (Backend will run on `http://localhost:3001` by default).

    - **Start Frontend:** In the `frontend/` directory, run:

      ```bash
      npm run dev
      ```

      (Frontend will run on `http://localhost:5173` by default).

## Backend Endpoints (cURL Examples)

Replace `your_api_token` with your actual API token.

### 1. List Files

```bash
curl -X GET "http://localhost:3001/files/list?path=/Users/danylolepetynskyi/Desktop/LocalLLM/ai_access" \
     -H "Authorization: Bearer your_api_token"
```

### 2. Read File

```bash
curl -X GET "http://localhost:3001/files/read?path=/Users/danylolepetynskyi/Desktop/LocalLLM/ai_access/test.txt&previewLines=50" \
     -H "Authorization: Bearer your_api_token"
```

### 3. Write File

(Requires `ALLOW_WRITE=true` in `backend/.env`)

```bash
curl -X POST "http://localhost:3001/files/write" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer your_api_token" \
     -d '{ "path": "/Users/danylolepetynskyi/Desktop/LocalLLM/ai_access/new_file.txt", "content": "Hello from AI Assistant!" }'
```

### 4. Delete File

(Requires `ALLOW_DELETE=true` in `backend/.env`)

```bash
curl -X POST "http://localhost:3001/files/delete" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer your_api_token" \
     -d '{ "path": "/Users/danylolepetynskyi/Desktop/LocalLLM/ai_access/file_to_delete.txt" }'
```

### 5. Ask LLM

```bash
curl -X POST "http://localhost:3001/llm/ask" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer your_api_token" \
     -d '{ "prompt": "Summarize the file at /Users/danylolepetynskyi/Desktop/LocalLLM/ai_access/notes.txt" }'
```

### 6. Execute LLM Action (Internal API)

```bash
curl -X POST "http://localhost:3001/llm/action" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer your_api_token" \
     -d '{ "action": "read", "path": "/Users/danylolepetynskyi/Desktop/LocalLLM/ai_access/some_file.txt", "args": { "previewLines": 10 } }'
```

## Important Security Notes:

- Run this application _only_ locally.
- Keep your `API_TOKEN` secure and never commit it to version control.
- Exercise extreme caution when enabling `ALLOW_WRITE` or `ALLOW_DELETE` as they grant the AI model significant control over your file system.
- **Recommendation:** Consider running the Backend in a Docker container with specific directories mounted (e.g., only `ALLOWED_ROOTS`) to enhance security and isolate file system access.

## Project Structure

- `backend/`: NestJS server that handles file system operations and LLM integration.
- `frontend/`: React application (Vite) for the graphical user interface.

## Functional Requirements Overview

- **File Browsing, Reading, Writing, Deleting:** Controlled access to specified `ALLOWED_ROOTS`.
- **LLM Integration:** Backend acts as a proxy to a local LLM, supporting function-calling for file operations.
- **Authentication & Audit:** Simple Bearer token authentication and comprehensive logging of all operations.
- **Configuration:** All critical settings managed via environment variables.
- **User Interface:** Tree-view directory browser, file editor/viewer, and a chat interface for LLM interaction.

Feel free to explore the code, contribute, and enhance the functionalities based on your needs!
