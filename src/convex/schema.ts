import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // add other tables here

    // Marketplace: user-submitted editing & design resources.
    resources: defineTable({
      title: v.string(),
      description: v.string(),
      url: v.string(),
      category: v.string(),
      authorId: v.id("users"),
      price: v.number(), // 0 = free
      featured: v.optional(v.boolean()),
      status: v.union(v.literal("published"), v.literal("hidden")),
      createdAt: v.number(),
    })
      .index("by_status", ["status"])
      .index("by_category", ["category"])
      .index("by_author", ["authorId"]),

    // Comments users leave on a resource detail page.
    comments: defineTable({
      resourceId: v.id("resources"),
      authorId: v.id("users"),
      body: v.string(),
      createdAt: v.number(),
    }).index("by_resource", ["resourceId"]),

    // Purchases. amount is stored in cents; 0 means the resource is free.
    purchases: defineTable({
      resourceId: v.id("resources"),
      userId: v.id("users"),
      amount: v.number(),
      status: v.union(v.literal("pending"), v.literal("completed")),
      createdAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_resource", ["resourceId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
