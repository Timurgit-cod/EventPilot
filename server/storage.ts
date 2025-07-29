import {
  users,
  events,
  userAnalytics,
  type User,
  type InsertUser,
  type Event,
  type InsertEvent,
  type UpdateEvent,
  type UserAnalytic,
  type InsertUserAnalytic,
} from "@shared/schema";
import { db } from "./db";
import { eq, like, asc, or } from "drizzle-orm";
import { randomUUID } from "crypto";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Event operations
  getEvents(): Promise<Event[]>;
  getEventsByMonth(year: number, month: number): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent, createdBy: string): Promise<Event>;
  updateEvent(id: string, event: UpdateEvent): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<boolean>;
  
  // Analytics operations
  logUserAction(userId: string, action: string, eventId?: string, metadata?: any): Promise<void>;
  getUserAnalytics(userId: string): Promise<UserAnalytic[]>;
  getAllAnalytics(): Promise<UserAnalytic[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private events: Map<string, Event>;
  private analytics: Map<string, UserAnalytic>;

  constructor() {
    this.users = new Map();
    this.events = new Map();
    this.analytics = new Map();
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(userData: InsertUser): Promise<User> {
    const user: User = {
      id: userData.id,
      username: userData.username,
      isAdmin: userData.isAdmin || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  // Event operations
  async getEvents(): Promise<Event[]> {
    return Array.from(this.events.values()).sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  }

  async getEventsByMonth(year: number, month: number): Promise<Event[]> {
    const monthStr = month.toString().padStart(2, '0');
    const yearStr = year.toString();
    
    return Array.from(this.events.values())
      .filter(event => 
        event.startDate.startsWith(`${yearStr}-${monthStr}`) ||
        event.endDate.startsWith(`${yearStr}-${monthStr}`)
      )
      .sort((a, b) => 
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
  }

  async getEvent(id: string): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async createEvent(eventData: InsertEvent, createdBy: string): Promise<Event> {
    const id = randomUUID();
    const event: Event = {
      id,
      title: eventData.title,
      description: eventData.description || null,
      startDate: eventData.startDate,
      endDate: eventData.endDate,
      category: eventData.category,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.events.set(id, event);
    return event;
  }

  async updateEvent(id: string, eventData: UpdateEvent): Promise<Event | undefined> {
    const existingEvent = this.events.get(id);
    if (!existingEvent) {
      return undefined;
    }

    const updatedEvent: Event = {
      ...existingEvent,
      ...eventData,
      updatedAt: new Date(),
    };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteEvent(id: string): Promise<boolean> {
    return this.events.delete(id);
  }

  // Analytics operations
  async logUserAction(userId: string, action: string, eventId?: string, metadata?: any): Promise<void> {
    const analytic: UserAnalytic = {
      id: randomUUID(),
      userId,
      eventId: eventId || null,
      action,
      timestamp: new Date(),
      metadata: metadata || null,
    };
    this.analytics.set(analytic.id, analytic);
  }

  async getUserAnalytics(userId: string): Promise<UserAnalytic[]> {
    return Array.from(this.analytics.values()).filter(a => a.userId === userId);
  }

  async getAllAnalytics(): Promise<UserAnalytic[]> {
    return Array.from(this.analytics.values());
  }
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  // Event operations
  async getEvents(): Promise<Event[]> {
    return await db.select().from(events).orderBy(asc(events.startDate));
  }

  async getEventsByMonth(year: number, month: number): Promise<Event[]> {
    const monthStr = month.toString().padStart(2, '0');
    const yearStr = year.toString();
    const datePattern = `${yearStr}-${monthStr}%`;
    
    return await db
      .select()
      .from(events)
      .where(or(
        like(events.startDate, datePattern),
        like(events.endDate, datePattern)
      ))
      .orderBy(asc(events.startDate));
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }

  async createEvent(eventData: InsertEvent, createdBy: string): Promise<Event> {
    const [event] = await db
      .insert(events)
      .values({
        ...eventData,
        createdBy,
      })
      .returning();
    return event;
  }

  async updateEvent(id: string, eventData: UpdateEvent): Promise<Event | undefined> {
    const [event] = await db
      .update(events)
      .set({
        ...eventData,
        updatedAt: new Date(),
      })
      .where(eq(events.id, id))
      .returning();
    return event || undefined;
  }

  async deleteEvent(id: string): Promise<boolean> {
    const result = await db.delete(events).where(eq(events.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Analytics operations
  async logUserAction(userId: string, action: string, eventId?: string, metadata?: any): Promise<void> {
    await db.insert(userAnalytics).values({
      userId,
      eventId: eventId || null,
      action,
      metadata: metadata || null,
    });
  }

  async getUserAnalytics(userId: string): Promise<UserAnalytic[]> {
    return await db.select().from(userAnalytics).where(eq(userAnalytics.userId, userId));
  }

  async getAllAnalytics(): Promise<UserAnalytic[]> {
    return await db.select().from(userAnalytics);
  }
}

export const storage = new DatabaseStorage();
