# Real-Time Chat Application Implementation Plan

A step-by-step implementation plan to build a secure, high-performance real-time chat application using Laravel, Inertia, Vue 3, TypeScript, and SQLite. Strict TypeScript types will be used throughout the application, and the `any` keyword will be strictly avoided.

---

## Technical Stack & Packages

We will leverage the following packages and tools:

1. **WebSockets (Real-Time)**:
   - **Backend**: `laravel/reverb` (First-party, high-performance WebSocket server for Laravel, optimized for speed and simplicity).
   - **Frontend**: `laravel-echo` and `pusher-js` to connect to Reverb.
2. **Icons**:
   - `lucide-vue-next` for a modern, sleek iconography system.
3. **Audio Recording**:
   - Native HTML5 **MediaRecorder API** (no external packages required, keeping bundle sizes small).
4. **State Management**:
   - Native Vue **Composition API** (reactives/refs) alongside Inertia's state preservation for lightweight and clean state management.

---

## Performance Considerations (SQLite & Scale)

To ensure maximum performance and responsive interactions under SQLite:

1. **SQLite WAL (Write-Ahead Logging) Mode**:
   - By default, SQLite locks the entire database file during writes. We will enable WAL mode (`PRAGMA journal_mode=WAL;`) to allow concurrent reads and writes, preventing application locks during high-frequency real-time chatting.
2. **Database Indexing**:
   - We will create composite indexes on the `messages` table for `(sender_id, receiver_id, created_at)` to query the chat history between two users instantaneously.
3. **Eager Loading**:
   - We will eager load relationship models (like attachment files and users) using `Message::with(...)` to avoid SQL `N+1` query issues.
4. **Message Pagination (Infinite Scroll)**:
   - Chat history will be loaded in pages (e.g., 30 messages at a time) using cursor or offset-based pagination. As the user scrolls up in the chat window, the next page will load, keeping the DOM lightweight and memory usage low.
5. **Debouncing and Throttling WebSockets**:
   - Typing indicators will be throttled. Instead of sending a socket message on every keypress, we will trigger it once at the start of typing and throttle subsequent updates to every 3-4 seconds.
6. **File Chunking / Upload Limits**:
   - Set sensible file validation limits (e.g., max 10MB) and store uploaded files in public/private storage, saving only the path, size, and original filename in SQLite.

---

## User Review Required

Please review the proposed step-by-step plan and let me know if you would like to adjust any phases before we execute **Phase 1 (Register and Login)**.

> [!IMPORTANT]
> The TypeScript configurations will be set up with strict settings. We will define clear interfaces for all models and response payloads to ensure 100% type-safety without using `any`.

---

## Proposed Phases of Development

### Phase 1: Authentication (Register & Login) — *CURRENT FOCUS*
We will build a simple, clean, and modern register/login page using TailwindCSS.
- Setup login, register, and logout routes.
- Build backend Controllers: `Auth/RegisterController` and `Auth/LoginController`.
- Create responsive frontend components with Vue & TypeScript:
  - [Login.vue](resources/js/pages/Auth/Login.vue)
  - [Register.vue](resources/js/pages/Auth/Register.vue)
- Update authentication middleware to redirect users properly.

### Phase 2: Chat Layout & User List
Once authentication is verified, we will build the primary layout.
- Create a two-column layout (sidebar on the left, active chat on the right).
- Fetch and display the list of other registered users on the sidebar, showing their status, name, and last sent message.
- Build search/filter functionality on the user list.

### Phase 3: Direct Messaging Engine (CRUD)
- Create database migration for the `messages` table:
  - `id`, `sender_id`, `receiver_id`, `body`, `read_at`, `created_at`, `updated_at`.
- Build controllers to fetch, send, edit, and delete messages.
- Implement soft-deletes or message updates in the database.
- Build frontend message container with scrolling, message status (sent/read), and edit/delete interactions.

### Phase 4: WebSockets & Real-Time Broadcasts
- Install and configure `laravel/reverb`.
- Configure `Laravel Echo` on the frontend with TypeScript.
- Define broadcasting channels and events (`MessageSent`, `MessageUpdated`, `MessageDeleted`, `UserTyping`).
- Implement UI listeners to dynamically append new messages, edit existing ones, or remove deleted ones in real-time.

### Phase 5: Multimedia (Files & Voice Messages)
- Extend the `messages` table with attachment fields: `file_path`, `file_name`, `file_type`, `file_size`, `is_audio`.
- Implement file uploads using standard multi-part Inertia forms.
- Build browser-native audio recorder for voice notes with visual waveforms or timers, exporting to lightweight audio files (`.webm`/`.ogg`).
- Render rich media components (image previews, file download buttons, audio player) inside chat bubbles.

---

## Verification Plan

### Automated Tests
- None in this initial plan phase. In future phases, we can write Pest tests for endpoints.

### Manual Verification
1. Run local development environment: `npm run dev`.
2. Visit `http://localhost:8000/register` to register a new user.
3. Visit `http://localhost:8000/login` to log in with correct credentials.
4. Attempt logging in with invalid credentials to verify validation errors are properly displayed.
5. Log out to ensure session is cleared.
