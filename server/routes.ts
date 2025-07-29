import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEventSchema, updateEventSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import session from "express-session";
import MemoryStore from "memorystore";

// Simple auth credentials
const USERS = {
  'admincibwest': { password: 'calendarcibwest', isAdmin: true, id: 'admin' },
  'user': { password: '12345test', isAdmin: false, id: 'user' }
};

// Session middleware setup
const setupSession = (app: Express) => {
  const SessionStore = MemoryStore(session);
  
  app.use(session({
    secret: process.env.SESSION_SECRET || 'calendar-secret-key',
    store: new SessionStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));
};

// Authentication middleware
const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.session && (req.session as any).user) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};

// Admin check middleware
const isAdmin: RequestHandler = (req, res, next) => {
  if (req.session && (req.session as any).user && (req.session as any).user.isAdmin) {
    next();
  } else {
    res.status(403).json({ message: "Admin access required" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  setupSession(app);

  // Login route
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    
    const user = USERS[username as keyof typeof USERS];
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Неверный логин или пароль" });
    }
    
    (req.session as any).user = {
      id: user.id,
      username,
      isAdmin: user.isAdmin
    };
    
    res.json({ success: true, user: { id: user.id, username, isAdmin: user.isAdmin } });
  });
  
  // Logout route
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Ошибка при выходе" });
      }
      res.json({ success: true });
    });
  });

  // Get current user
  app.get('/api/auth/user', isAuthenticated, (req, res) => {
    const sessionUser = (req.session as any).user;
    res.json({
      id: sessionUser.id,
      username: sessionUser.username,
      isAdmin: sessionUser.isAdmin
    });
  });

  // Event routes - all authenticated users can view events
  app.get("/api/events", async (req, res) => {
    try {
      const events = await storage.getEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get("/api/events/:year/:month", async (req, res) => {
    try {
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);
      
      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return res.status(400).json({ message: "Invalid year or month" });
      }
      
      const events = await storage.getEventsByMonth(year, month);
      res.json(events);
    } catch (error) {
      console.error("Error fetching events by month:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  app.post("/api/events", isAdmin, async (req: any, res) => {
    try {
      const validationResult = insertEventSchema.safeParse(req.body);
      if (!validationResult.success) {
        const validationError = fromZodError(validationResult.error);
        return res.status(400).json({ message: validationError.message });
      }

      const userId = req.user.claims.sub;
      const event = await storage.createEvent(validationResult.data, userId);
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  app.put("/api/events/:id", isAdmin, async (req, res) => {
    try {
      const validationResult = updateEventSchema.safeParse(req.body);
      if (!validationResult.success) {
        const validationError = fromZodError(validationResult.error);
        return res.status(400).json({ message: validationError.message });
      }

      const event = await storage.updateEvent(req.params.id, validationResult.data);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ message: "Failed to update event" });
    }
  });

  app.delete("/api/events/:id", isAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteEvent(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
