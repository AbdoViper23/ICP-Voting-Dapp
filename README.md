# ICP Voting Dapp

A simple decentralized voting application built on the Internet Computer Protocol (ICP).

<img width="1015" height="966" alt="Screenshot from 2025-07-30 18-00-06" src="https://github.com/user-attachments/assets/a3e79e14-d454-4e69-8c26-d4b09593b59f" />


## Features
- Create new polls with custom options
- Vote on available polls
- View real-time poll results
- Minimal, clean frontend (React + Tailwind CSS)
- Rust backend canister

## Tech Stack
- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Rust (ICP Canister)
- **ICP SDK:** DFINITY dfx

## Getting Started

### Prerequisites
- Node.js >= 16
- npm >= 7
- [DFINITY SDK (dfx)](https://internetcomputer.org/docs/current/developer-docs/setup/install/)

### Install dependencies
```bash
npm install
```

### Start the frontend only (for development)
```bash
npm run dev
```

### Deploy on local ICP
```bash
dfx start --background
dfx deploy
```

### Generate declarations (if needed)
```bash
dfx generate
```

## Project Structure
- `src/voting-app-frontend/` — Frontend React app
- `src/voting-app-backend/` — Rust canister code
