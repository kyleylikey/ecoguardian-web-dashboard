# Network Access Setup Guide

This guide explains how to configure the EcoGuardian Web Dashboard to be accessible from other devices on your local network.

## Overview

The application consists of two parts:
1. **Backend Server** (Node.js/Express with WebSockets) - Runs on port 3000
2. **Frontend Dashboard** (React/Vite) - Runs on port 5173 (development) or served by backend (production)

## Quick Start for Network Access

### Step 1: Start the Backend Server

Navigate to the server directory and start the server:

```bash
cd server
npm install  # Only needed first time
npm run dev
```

The server will display output like this:

```
✅ EcoGuardian Server Started
─────────────────────────────────
📍 Local:   http://localhost:3000
📍 Network: http://192.168.1.100:3000
🔌 WebSocket: ws://localhost:3000
─────────────────────────────────
```

**Important:** Note the Network IP address (e.g., `192.168.1.100`). You'll need this for the next step.

### Step 2: Configure the Frontend

1. Open the `.env` file in the root directory
2. Update `VITE_API_BASE_URL` with your network IP:

```env
VITE_API_BASE_URL=http://192.168.1.100:3000
```

Replace `192.168.1.100` with the actual Network IP shown when you started the server in Step 1.

### Step 3: Start the Frontend (Development Mode)

From the root directory:

```bash
npm install  # Only needed first time
npm run dev
```

Vite will display output like this:

```
VITE v7.1.0  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: http://192.168.1.100:5173/
➜  press h + enter to show help
```

### Step 4: Access from Other Devices

On any device connected to the same network:

1. Open a web browser
2. Navigate to: `http://192.168.1.100:5173` (use the Network IP from Step 3)
3. The dashboard should load and connect to the backend via WebSockets automatically

## Production Deployment

For production, build the frontend and serve it from the backend server:

### Step 1: Build the Frontend

```bash
npm run build
```

This creates a `dist` folder with the production-ready files.

### Step 2: Configure Production Environment

Update the `.env` file with your network IP:

```env
VITE_API_BASE_URL=http://192.168.1.100:3000
```

Then rebuild:

```bash
npm run build
```

### Step 3: Start the Backend Server

```bash
cd server
npm run dev
```

### Step 4: Access the Application

The backend now serves both the API and the frontend:
- From the host machine: `http://localhost:3000`
- From network devices: `http://192.168.1.100:3000` (use your actual network IP)

## Troubleshooting

### Issue: Cannot connect from other devices

**Solution:**
1. Verify all devices are on the same network
2. Check firewall settings - ensure ports 3000 and 5173 are not blocked
3. Confirm you're using the correct network IP address (not 127.0.0.1 or localhost)

**Windows Firewall:**
```powershell
# Allow Node.js through firewall
netsh advfirewall firewall add rule name="Node.js Server" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="Vite Dev Server" dir=in action=allow protocol=TCP localport=5173
```

**macOS Firewall:**
- Go to System Preferences → Security & Privacy → Firewall → Firewall Options
- Allow incoming connections for Node and Terminal/iTerm

**Linux (ufw):**
```bash
sudo ufw allow 3000/tcp
sudo ufw allow 5173/tcp
```

### Issue: WebSocket connection fails

**Solution:**
1. Ensure `VITE_API_BASE_URL` is set to the network IP (not localhost)
2. The WebSocket URL is automatically derived from the API URL
3. Check browser console for connection errors
4. Verify the backend server is running

### Issue: Network IP keeps changing

**Solution:**
Set a static IP for your development machine in your router settings or network configuration.

**Windows:**
- Control Panel → Network and Sharing Center → Change adapter settings
- Right-click your network adapter → Properties → Internet Protocol Version 4
- Set manual IP address

**macOS:**
- System Preferences → Network → Advanced → TCP/IP
- Configure IPv4: Manually

**Linux:**
```bash
# Edit netplan configuration (Ubuntu)
sudo nano /etc/netplan/01-network-manager-all.yaml
```

## Network Configuration Details

### Backend Server (server/server.js)

The server is already configured to listen on all network interfaces:

```javascript
server.listen(PORT, '0.0.0.0', () => {
  // Server accessible from any IP
});
```

### Frontend (vite.config.js)

The Vite dev server is configured to accept connections from the network:

```javascript
export default defineConfig({
  server: {
    host: '0.0.0.0',  // Listen on all interfaces
    port: 5173,
  },
});
```

### Environment Variables (.env)

The frontend uses environment variables for API configuration:

- `VITE_API_BASE_URL`: HTTP API endpoint
- WebSocket URL: Automatically derived by replacing `http` with `ws`

## Security Considerations

⚠️ **Important Security Notes:**

1. **Local Network Only**: This setup is designed for local network access. Do not expose these ports directly to the internet without proper security measures.

2. **Firewall**: Only open necessary ports and restrict access to your local network.

3. **Authentication**: Consider adding authentication if sensitive data is being transmitted.

4. **HTTPS/WSS**: For production deployments, use HTTPS/WSS with proper SSL certificates.

## Advanced Configuration

### Custom Ports

To change the default ports:

**Backend (server/server.js):**
```javascript
const PORT = process.env.PORT || 3000;
```

**Frontend (vite.config.js):**
```javascript
server: {
  port: 5173, // Change this
}
```

Update `.env` accordingly:
```env
VITE_API_BASE_URL=http://192.168.1.100:YOUR_PORT
```

### Multiple Network Interfaces

If your machine has multiple network interfaces, the server will automatically detect and display the first non-internal IPv4 address. To use a specific interface, you can modify `server/server.js`.

## Testing the Setup

### Test Backend API

From any device on the network:

```bash
curl http://192.168.1.100:3000/api/sensornodes
```

You should receive a JSON response.

### Test WebSocket Connection

Open browser console on any device and run:

```javascript
const ws = new WebSocket('ws://192.168.1.100:3000');
ws.onopen = () => console.log('Connected!');
ws.onmessage = (e) => console.log('Message:', e.data);
```

You should see "Connected!" and receive messages.

## Support

If you encounter issues:

1. Check all steps were followed correctly
2. Verify firewall settings
3. Ensure devices are on the same network
4. Check the server console for error messages
5. Check browser console for frontend errors
