import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  index,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "../auth-schema";
import { relations } from "..";

export const formStatus = pgEnum("status", ["filling", "submitted", "not_submitted"]);

export const form = pgTable(
  "form",
  {
    id: uuid("form_id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    description: text("description"),
    formUrl: text("form_url").notNull().unique(),
    views: integer("views").notNull().default(0),
    currentVersion: integer("current_version").notNull().default(1),
    isPublished: boolean("is_published").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("form_userId_idx").on(table.userId)],
);

export const formSnapshot = pgTable(
  "form_snapshot",
  {
    id: uuid("form_snapshot_id").primaryKey().defaultRandom(),
    formId: uuid("form_id")
      .notNull()
      .references(() => form.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    fieldsJson: jsonb("fields_json").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("form_snapshot_idx").on(table.formId)],
);

export const formField = pgTable(
  "form_field",
  {
    id: uuid("form_field_id").primaryKey().defaultRandom(),
    formId: uuid("form_id")
      .notNull()
      .references(() => form.id, { onDelete: "cascade" }),
    fieldKey: uuid("field_key_id").notNull().defaultRandom(),
    type: text("type").notNull(),
    category: text("category").notNull(),
    label: text("label").notNull(),
    required: boolean("required").notNull().default(false),
    fieldOrder: integer("field_order").notNull(),
    config: jsonb("config"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("form_field_idx").on(table.formId)],
);

export const submission = pgTable(
  "submission",
  {
    id: uuid("submission_id").primaryKey().defaultRandom(),
    formId: uuid("form_id")
      .notNull()
      .references(() => form.id, { onDelete: "cascade" }),
    snapshotId: uuid("snapshot_id")
      .notNull()
      .references(() => formSnapshot.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),

    status: formStatus("status").notNull().default("filling"),
    draftAnswer: jsonb("draft_answer"),
    startedAt: timestamp("started_at").notNull().defaultNow(),
    lastActivity: timestamp("last_activity").notNull().defaultNow(),
    submittedAt: timestamp("submitted_at"),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("submission_formId_idx").on(table.formId),
    index("submission_userId_idx").on(table.userId),
  ],
);

export const answer = pgTable(
  "answer",
  {
    id: uuid("answer_id").primaryKey().defaultRandom(),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => submission.id, { onDelete: "cascade" }),
    fieldId: uuid("field_id")
      .notNull()
      .references(() => formField.id, { onDelete: "cascade" }),
    fieldKey: uuid("field_key_id").notNull(),
    value: jsonb("value"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("answer_submissionId_idx").on(table.submissionId)],
);


export const formRelation = relations(form , ({many}) => ({
  formField : many(formField) , 
  formSnapshot : many(formSnapshot)
}))

export const  fromSnapshotRelation = relations(formSnapshot , ({many}) => ({
 submission : many(submission)
}))

export const submissionRelation = relations(submission , ({}) => ({}))

export const formFeild