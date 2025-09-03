import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEventSchema, updateEventSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import session from "express-session";
import MemoryStore from "memorystore";
import { randomUUID } from "crypto";

// Admin credentials for validation
const ADMIN_CREDENTIALS = {
  username: 'admincibwest',
  password: 'calendarcibwest'
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

  // Login route - accepts any credentials, admin only for specific login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(401).json({ message: "Неверный логин или пароль" });
      }
      
      // Admin credentials
      if (username === 'admincibwest' && password === 'calendarcibwest') {
        // Get or create admin user
        let user = await storage.getUserByUsername(username);
        if (!user) {
          user = await storage.createUser({
            id: 'admin',
            username: 'admincibwest',
            isAdmin: true
          });
        }
        
        (req.session as any).user = user;
        await storage.logUserAction(user.id, 'login');
        return res.json({ success: true, user });
      }
      
      // Any other credentials create a regular user
      let user = await storage.getUserByUsername(username);
      if (!user) {
        user = await storage.createUser({
          id: randomUUID(),
          username,
          isAdmin: false
        });
      }
      
      (req.session as any).user = user;
      await storage.logUserAction(user.id, 'login');
      return res.json({ success: true, user });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Ошибка сервера' });
    }
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

      const userId = (req.session as any).user.id;
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

  // Analytics routes
  app.post('/api/analytics/event-view', isAuthenticated, async (req, res) => {
    try {
      const { eventId } = req.body;
      const userId = (req.session as any).user.id;
      
      await storage.logUserAction(userId, 'event_view', eventId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error logging event view:', error);
      res.status(500).json({ message: 'Failed to log event view' });
    }
  });

  // Get analytics (admin only)
  app.get('/api/analytics', isAdmin, async (req, res) => {
    try {
      const analytics = await storage.getAllAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ message: 'Failed to fetch analytics' });
    }
  });

  // Get user analytics (admin only)
  app.get('/api/analytics/user/:userId', isAdmin, async (req, res) => {
    try {
      const analytics = await storage.getUserAnalytics(req.params.userId);
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching user analytics:', error);
      res.status(500).json({ message: 'Failed to fetch user analytics' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
