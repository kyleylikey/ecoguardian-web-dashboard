
> ⚠ **Legal Notice:** By cloning, downloading, or using this repository, you agree to the terms in `EULA.md`.  
> If you do not agree, do **not** use this repository or any part of its contents.

# EcoGuardian Web Dashboard

A real-time environmental monitoring dashboard with WebSocket support for live data updates.

## Features

- 🌐 Network-accessible dashboard (access from any device on your local network)
- 🔄 Real-time data updates via WebSockets
- 📊 Environmental monitoring and risk detection
- 📱 Responsive design for mobile and desktop

## Quick Start (Local Development)

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Start the Backend Server

```bash
cd server
npm run dev
```

The server will start on port 3000 and display:
```
📍 Local:   http://localhost:3000
📍 Network: http://YOUR_NETWORK_IP:3000
```

### 3. Start the Frontend

In a new terminal, from the root directory:

```bash
npm run dev
```

Vite will start on port 5173:
```
➜  Local:   http://localhost:5173/
➜  Network: http://YOUR_NETWORK_IP:5173/
```

### 4. Access the Dashboard

- **Local:** http://localhost:5173
- **Network:** http://YOUR_NETWORK_IP:5173 (from any device on the same network)

## Network Access Setup

📖 **For detailed instructions on accessing the dashboard from other devices on your network, see [NETWORK_SETUP.md](./NETWORK_SETUP.md)**

Quick steps:
1. Start the backend server (note the Network IP)
2. Update `.env` with your network IP: `VITE_API_BASE_URL=http://YOUR_NETWORK_IP:3000`
3. Start the frontend
4. Access from any device using: `http://YOUR_NETWORK_IP:5173`

> **Note:** The `.env` file is tracked in version control for convenience. For sensitive deployments, consider adding `.env` to `.gitignore` and use `.env.example` as a template.

## Production Build

Build the frontend for production:

```bash
npm run build
```

The backend server will automatically serve the built files from the `dist` folder.

Start the server in production mode:
```bash
cd server
npm start
```

For development with auto-reload:
```bash
cd server
npm run dev
```

Access at: `http://YOUR_NETWORK_IP:3000`

## Technology Stack

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **WebSocket:** ws library for real-time updates
- **Database:** SQLite
- **UI Components:** Mantine, Material-UI

## Development

### ESLint Configuration

This project uses ESLint for code quality. To extend the configuration:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

For TypeScript integration, check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on integrating TypeScript and [`typescript-eslint`](https://typescript-eslint.io).

## Troubleshooting

- **Cannot connect from other devices:** Check firewall settings and ensure all devices are on the same network
- **WebSocket connection issues:** Verify `VITE_API_BASE_URL` in `.env` is set to your network IP
- **Port already in use:** Change ports in `vite.config.js` (frontend) or `server/server.js` (backend)

See [NETWORK_SETUP.md](./NETWORK_SETUP.md) for detailed troubleshooting steps.
