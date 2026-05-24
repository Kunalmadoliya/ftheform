import {
    pgTable , 
    uuid , 
    text , 
    varchar , 
    timestamp , boolean , integer
} from 'drizzle-orm/pg-core';

import { usersTable } from './user';


export const formsTable = pgTable("forms" , {
   id : uuid("id").primaryKey().defaultRandom(),
   title : varchar('title' , { length : 255}).notNull(),
   description : text(),
   
   createdBy :uuid("created_by").references(() => usersTable.id),
   is_public : boolean("is_public").default(false),

   link : text("form_link").notNull().unique(),
   limit : integer("limit").default(100),
   expire : timestamp("expire"),
   
   createdAt : timestamp('created_at').defaultNow(),
   updatedAt : timestamp('updated_at').$onUpdate(() => new Date())
})

