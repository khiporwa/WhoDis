
import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Configure CORS
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

// Global CORS middleware handles OPTIONS automatically
app.use(cors(corsOptions));

const io = new Server(httpServer, {
  cors: corsOptions
});

const PORT = Number(process.env.PORT) || 5000;
const SCREENSHOTS_DIR = path.resolve('screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Ensure payload limits are high
app.use(express.json({ limit: '50mb' }) as any);
app.use(express.urlencoded({ extended: true, limit: '50mb' }) as any);

app.use('/screenshots', express.static(SCREENSHOTS_DIR) as any);

app.get('/health', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ 
    status: 'ok', 
    time: new Date().toISOString()
  });
});

// --- CAPTURE API ---

app.post('/api/screenshots/upload', (req, res) => {
  const { sessionId, timestamp, imageData } = req.body;
  
  if (!sessionId || !imageData) {
    return res.status(400).json({ error: 'Payload missing data' });
  }

  try {
    const sessionDir = path.join(SCREENSHOTS_DIR, sessionId);
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

    const isPng = imageData.includes('image/png');
    const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;
    const extension = isPng ? 'png' : 'jpg';
    const fileName = `capture_${timestamp || Date.now()}.${extension}`;
    const filePath = path.join(sessionDir, fileName);
    
    fs.writeFile(filePath, base64Data, 'base64', (err) => {
      if (err) {
        console.error('[Server] File Write Error:', err);
        return res.status(500).json({ error: 'Failed to save image to disk' });
      }
      console.log(`[Server] Saved capture: ${fileName} (${(base64Data.length / 1024).toFixed(1)} KB)`);
      res.json({ success: true, path: fileName });
    });
  } catch (e: any) {
    console.error('[Server] Upload Route Exception:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- ADMIN API ---

app.get('/api/admin/screenshots', (req, res) => {
  try {
    if (!fs.existsSync(SCREENSHOTS_DIR)) return res.json([]);

    const folders = fs.readdirSync(SCREENSHOTS_DIR)
      .filter(f => fs.lstatSync(path.join(SCREENSHOTS_DIR, f)).isDirectory());
    
    const sessionList = folders.map(folder => {
      const folderPath = path.join(SCREENSHOTS_DIR, folder);
      const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.jpeg'));
      const stats = fs.statSync(folderPath);
      return {
        id: folder,
        count: files.length,
        lastCapture: stats.mtime
      };
    }).sort((a, b) => b.lastCapture.getTime() - a.lastCapture.getTime());

    res.json(sessionList);
  } catch (e) {
    res.status(500).json({ error: 'Failed to list sessions' });
  }
});

app.get('/api/admin/screenshots/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const sessionPath = path.join(SCREENSHOTS_DIR, sessionId);
  
  if (!fs.existsSync(sessionPath)) {
    return res.status(404).json({ error: 'Session not found' });
  }

  try {
    const files = fs.readdirSync(sessionPath)
      .filter(f => f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.jpeg'))
      .map(file => ({
        name: file,
        url: `/screenshots/${sessionId}/${file}`,
        timestamp: parseInt(file.replace('capture_', '').replace('.jpg', '').replace('.png', '').replace('.jpeg', ''))
      }))
      .sort((a, b) => b.timestamp - a.timestamp);

    res.json(files);
  } catch (e) {
    res.status(500).json({ error: 'Failed to list files' });
  }
});

app.delete('/api/admin/screenshots/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const sessionPath = path.join(SCREENSHOTS_DIR, sessionId);
  
  if (fs.existsSync(sessionPath)) {
    fs.rmSync(sessionPath, { recursive: true, force: true });
    return res.json({ success: true });
  }
  res.status(404).json({ error: 'Not found' });
});

// Use prefix-based matching for 404s in Express 5
app.use('/api', (req, res) => {
  res.status(404).json({ 
    error: 'API Endpoint Not Found',
    path: req.originalUrl
  });
});

// --- MATCHMAKING ---

interface UserCriteria {
  interests: string[];
  gender?: string;
}

interface WaitingUser {
  socket: Socket;
  criteria: UserCriteria;
  timestamp: number;
}

let waitingPool: WaitingUser[] = [];

function getInterestOverlap(interests1: string[], interests2: string[]): number {
  if (!interests1 || !interests2) return 0;
  const set1 = new Set(interests1.map(i => i.toLowerCase()));
  return interests2.filter(i => set1.has(i.toLowerCase())).length;
}

function findBestMatch(newUser: WaitingUser): WaitingUser | null {
  if (waitingPool.length === 0) return null;
  let bestCandidate: WaitingUser | null = null;
  let maxOverlap = -1;
  for (const candidate of waitingPool) {
    if (candidate.socket.id === newUser.socket.id) continue;
    const overlap = getInterestOverlap(newUser.criteria.interests, candidate.criteria.interests);
    if (overlap > maxOverlap) {
      maxOverlap = overlap;
      bestCandidate = candidate;
    } else if (overlap === 0 && maxOverlap === -1) {
       bestCandidate = candidate;
       maxOverlap = 0;
    }
  }
  return bestCandidate;
}

const broadcastOnlineCount = () => {
  io.emit('online-count', io.engine.clientsCount);
};

io.on('connection', (socket) => {
  broadcastOnlineCount();
  
  socket.on('join-matchmaking', (criteria: UserCriteria) => {
    // Remove existing entry for this socket if any
    waitingPool = waitingPool.filter(u => u.socket.connected && u.socket.id !== socket.id);
    
    const newUser: WaitingUser = { socket, criteria, timestamp: Date.now() };
    const match = findBestMatch(newUser);
    
    if (match) {
      console.log(`[Matchmaking] Pairing ${socket.id} with ${match.socket.id}`);
      
      // Remove candidate from pool
      waitingPool = waitingPool.filter(u => u.socket.id !== match.socket.id);
      
      const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      
      // CRITICAL: Both sockets MUST join the room to receive signaling messages
      socket.join(roomId);
      match.socket.join(roomId);
      
      // Emit events
      match.socket.emit('match-found', { roomId, isInitiator: true, partner: criteria });
      socket.emit('match-found', { roomId, isInitiator: false, partner: match.criteria });
    } else {
      console.log(`[Matchmaking] Added ${socket.id} to pool. Pool size: ${waitingPool.length + 1}`);
      waitingPool.push(newUser);
    }
  });

  socket.on('signal', (data) => {
    if (data.roomId) {
      socket.to(data.roomId).emit('signal', data);
    }
  });

  socket.on('chat-message', (data) => {
    if (data.roomId) {
      socket.to(data.roomId).emit('chat-message', data);
    }
  });

  socket.on('typing', (data) => {
    if (data.roomId) {
      socket.to(data.roomId).emit('typing', data);
    }
  });

  socket.on('leave-match', (roomId) => {
    if (roomId) {
      socket.to(roomId).emit('partner-disconnected');
      socket.leave(roomId);
    }
  });

  socket.on('disconnect', () => {
    waitingPool = waitingPool.filter(u => u.socket.id !== socket.id);
    broadcastOnlineCount();
  });
});

// Handle server startup errors (specifically EADDRINUSE for macOS users)
httpServer.on('error', (e: any) => {
  if (e.code === 'EADDRINUSE') {
    console.error('\n❌ ERROR: Port 5000 is already in use.');
    console.error('👉 If you are on a Mac, this is likely "AirPlay Receiver".');
    console.error('👉 FIX: System Settings > General > AirPlay & Handoff > Turn OFF AirPlay Receiver.');
    console.error('👉 OR: Run `kill -9 $(lsof -ti:5000)` in terminal.\n');
    process.exit(1);
  } else {
    console.error('❌ Server Error:', e);
  }
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 WhoDis Backend on Port: ${PORT}`);
});
