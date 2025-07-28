import {
  users,
  events,
  type User,
  type UpsertUser,
  type Event,
  type InsertEvent,
  type UpdateEvent,
} from "@shared/schema";
import { db } from "./db";
import { eq, like, asc } from "drizzle-orm";
import { randomUUID } from "crypto";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Event operations
  getEvents(): Promise<Event[]>;
  getEventsByMonth(year: number, month: number): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent, createdBy: string): Promise<Event>;
  updateEvent(id: string, event: UpdateEvent): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private events: Map<string, Event>;

  constructor() {
    this.users = new Map();
    this.events = new Map();
  }

  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id!);
    
    if (existingUser) {
      const updatedUser: User = {
        ...existingUser,
        ...userData,
        updatedAt: new Date(),
      };
      this.users.set(userData.id!, updatedUser);
      return updatedUser;
    } else {
      const newUser: User = {
        id: userData.id || randomUUID(),
        email: userData.email || null,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        profileImageUrl: userData.profileImageUrl || null,
        isAdmin: userData.isAdmin || false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.set(newUser.id, newUser);
      return newUser;
    }
  }

  // Event operations
  async getEvents(): Promise<Event[]> {
    return Array.from(this.events.values()).sort((a, b) => 
      new Date(a.date + ' ' + (a.time || '00:00')).getTime() - 
      new Date(b.date + ' ' + (b.time || '00:00')).getTime()
    );
  }

  async getEventsByMonth(year: number, month: number): Promise<Event[]> {
    const monthStr = month.toString().padStart(2, '0');
    const yearStr = year.toString();
    
    return Array.from(this.events.values())
      .filter(event => event.date.startsWith(`${yearStr}-${monthStr}`))
      .sort((a, b) => 
        new Date(a.date + ' ' + (a.time || '00:00')).getTime() - 
        new Date(b.date + ' ' + (b.time || '00:00')).getTime()
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
      date: eventData.date,
      time: eventData.time || null,
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
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Event operations
  async getEvents(): Promise<Event[]> {
    return await db.select().from(events).orderBy(asc(events.date), asc(events.time));
  }

  async getEventsByMonth(year: number, month: number): Promise<Event[]> {
    const monthStr = month.toString().padStart(2, '0');
    const yearStr = year.toString();
    const datePattern = `${yearStr}-${monthStr}%`;
    
    return await db
      .select()
      .from(events)
      .where(like(events.date, datePattern))
      .orderBy(asc(events.date), asc(events.time));
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
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
