import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth system
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  username: varchar("username"),
  email: varchar("email"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: text("profile_image_url"),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  startDate: varchar("start_date").notNull(), // YYYY-MM-DD format
  endDate: varchar("end_date").notNull(), // YYYY-MM-DD format
  category: varchar("category").notNull(),
  industry: varchar("industry").notNull().default('межотраслевое'),
  country: varchar("country"), // Страна для зарубежных событий
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User analytics table to track clicks and interactions
export const userAnalytics = pgTable("user_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  eventId: varchar("event_id").references(() => events.id),
  action: varchar("action").notNull(), // 'login', 'event_click', 'view_event', etc.
  timestamp: timestamp("timestamp").defaultNow(),
  metadata: jsonb("metadata"), // Additional data like IP, browser, etc.
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  category: z.enum(['internal', 'external', 'foreign']),
  industry: z.enum(['межотраслевое', 'фарма', 'агро', 'IT', 'промышленность', 'ретейл']),
  country: z.enum(['США', 'Великобритания', 'Евросоюз', 'Германия', 'Япония', 'Индия', 'Бразилия', 'Китай']).optional()
});

export const updateEventSchema = insertEventSchema.partial();

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type UpdateEvent = z.infer<typeof updateEventSchema>;
export type UserAnalytic = typeof userAnalytics.$inferSelect;
export type InsertUserAnalytic = typeof userAnalytics.$inferInsert;
