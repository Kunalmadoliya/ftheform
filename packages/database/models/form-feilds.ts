import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  boolean,
  numeric,
  pgEnum,
  unique
} from "drizzle-orm/pg-core";

import { formsTable } from "./form";


export const fieldTypeEnum = pgEnum("field_type", [
  "text",
  "email",
  "number",
  "select",
  "radio",
  "checkbox",
  "textarea",
  "date",
  "file",
]);

export const formsFeildsTable = pgTable("forms_feilds", {
  id: uuid("id").primaryKey().defaultRandom(),

  label: varchar("label", { length: 255 }).notNull(),
  labelKey: varchar().notNull(),
  description: text(),

  type: fieldTypeEnum("feild_type").notNull(),

  placeholder: varchar("placeholder", { length: 255 }),
  isRequired: boolean("is_required").default(false),

  index: numeric("index", { scale: 2 }).notNull(),

  formId: uuid("form_id").references(() => formsTable.id),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(()=> new Date()),
} , (table) => {
    return {
          uniqueFormIdAndIndex : unique().on(table.formId , table.index)
    }
})
