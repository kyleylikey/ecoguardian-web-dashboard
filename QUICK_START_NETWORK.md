# Quick Start: Network Access in 5 Steps

This is a simplified guide to get your EcoGuardian Dashboard accessible on your local network quickly.

## Prerequisites
- All devices must be on the same WiFi/network
- Node.js installed on the host machine

## Step 1: Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

## Step 2: Start the Backend

```bash
cd server
npm start
```

You'll see output like:
```
✅ EcoGuardian Server Started
─────────────────────────────────
📍 Local:   http://localhost:3000
📍 Network: http://192.168.1.100:3000  <-- COPY THIS IP!
🔌 WebSocket: ws://localhost:3000
─────────────────────────────────
```

**Important:** Write down the Network IP (e.g., `192.168.1.100`)

## Step 3: Configure Frontend

1. Open `.env` file in the root directory
2. Change this line:
   ```
   VITE_API_BASE_URL=http://localhost:3000
   ```
   To (using YOUR network IP from Step 2):
   ```
   VITE_API_BASE_URL=http://192.168.1.100:3000
   ```

## Step 4: Start the Frontend

In a new terminal:
```bash
npm run dev
```

You'll see:
```
➜  Local:   http://localhost:5173/
➜  Network: http://192.168.1.100:5173/  <-- Share this URL!
```

## Step 5: Access from Other Devices

On any device (phone, tablet, laptop) connected to the same network:

1. Open a web browser
2. Go to: `http://192.168.1.100:5173` (use YOUR network IP)
3. Done! 🎉

## Production Mode (Optional)

For a production setup where everything runs from one server:

```bash
# Build the frontend
npm run build

# Start only the backend (it will serve the frontend)
cd server
npm start
```

Access from: `http://192.168.1.100:3000`

## Troubleshooting

### Can't connect from other devices?

1. **Firewall:** Make sure ports 3000 and 5173 are allowed
   - Windows: Run PowerShell as Administrator and execute:
     ```powershell
     netsh advfirewall firewall add rule name="EcoGuardian" dir=in action=allow protocol=TCP localport=3000 localsubnet=yes
     netsh advfirewall firewall add rule name="EcoGuardian Vite" dir=in action=allow protocol=TCP localport=5173 localsubnet=yes
     ```
   - Mac: System Preferences → Security → Firewall → Allow Node
   - Linux: `sudo ufw allow 3000/tcp && sudo ufw allow 5173/tcp`

2. **Same Network:** Verify all devices are on the same WiFi

3. **Correct IP:** Double-check you're using the Network IP shown when starting the server

### WebSocket not connecting?

Make sure `.env` has the network IP (not localhost):
```
VITE_API_BASE_URL=http://192.168.1.100:3000
```

Then rebuild:
```bash
npm run dev
```

## Need More Help?

See [NETWORK_SETUP.md](./NETWORK_SETUP.md) for detailed instructions and advanced configuration.
