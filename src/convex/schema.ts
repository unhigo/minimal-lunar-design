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

/**
 * Product fields captured by the /submit wizard. Stored flat on `submissions`
 * and embedded on `resources.productFields` when a submission is published.
 */
export const submissionValidator = v.object({
  // Paso 1 — identidad
  title: v.string(),
  url: v.string(),
  logoStorageId: v.optional(v.id("_storage")),
  tagline: v.string(),
  // Paso 2 — clasificación
  category: v.string(),
  platforms: v.array(v.string()),
  ecosystems: v.array(v.string()),
  tags: v.array(v.string()),
  // Paso 3 — multimedia
  gallery: v.array(
    v.object({
      storageId: v.id("_storage"),
      caption: v.optional(v.string()),
    }),
  ),
  thumbStorageId: v.optional(v.id("_storage")),
  videoUrl: v.optional(v.string()),
  // Paso 4 — pricing / licencia
  pricing: v.string(),
  pricingDetails: v.optional(v.string()),
  license: v.string(),
  discountCode: v.optional(v.string()),
  discountPercent: v.optional(v.number()),
  // Paso 5 — descripción
  description: v.string(),
  features: v.array(v.string()),
  // Paso 6 — creador y moderación
  senderRole: v.string(),
  authorHandle: v.string(),
  authorLinks: v.array(v.string()),
  contactEmail: v.string(),
  // Programación de lanzamientos (futuras publicaciones automatizadas)
  scheduledDate: v.optional(v.number()),
});
export type SubmissionFields = Infer<typeof submissionValidator>;

/** Spread into defineTable for `submissions` (adds submitterId/status/createdAt). */
const submissionValidatorFields = submissionValidator.fields;

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
      url: v.optional(v.string()), // external link, when the resource is not a file
      category: v.string(),
      authorId: v.id("users"),
      price: v.number(), // 0 = free
      featured: v.optional(v.boolean()),
      status: v.union(v.literal("published"), v.literal("hidden")),
      // Uploaded image (Convex file storage): the resource file itself and/or
      // the cover preview shown on cards and detail pages.
      fileStorageId: v.optional(v.id("_storage")),
      coverStorageId: v.optional(v.id("_storage")),
      fileMeta: v.optional(
        v.object({
          name: v.string(),
          type: v.string(),
          size: v.number(),
          width: v.optional(v.number()),
          height: v.optional(v.number()),
        }),
      ),
      // Product metadata captured by the /submit wizard (embedded when a
      // submission is published or an owner enriches an existing resource).
      productFields: v.optional(
        v.object({
          tagline: v.optional(v.string()),
          platforms: v.array(v.string()),
          ecosystems: v.array(v.string()),
          tags: v.array(v.string()),
          gallery: v.array(
            v.object({
              storageId: v.id("_storage"),
              caption: v.optional(v.string()),
            }),
          ),
          videoUrl: v.optional(v.string()),
          pricing: v.optional(v.string()),
          pricingDetails: v.optional(v.string()),
          license: v.optional(v.string()),
          discountCode: v.optional(v.string()),
          discountPercent: v.optional(v.number()),
          features: v.array(v.string()),
          senderRole: v.optional(v.string()),
          authorHandle: v.optional(v.string()),
          authorLinks: v.array(v.string()),
        }),
      ),
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

    // Directory submissions from the /submit wizard. Always created with
    // status "pending"; admins moderate from /admin and can publish as a
    // resource. `scheduledDate` supports future automated launches.
    submissions: defineTable({
      ...submissionValidatorFields,
      submitterId: v.id("users"),
      status: v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected"),
        v.literal("published"),
      ),
      createdAt: v.number(),
    }).index("by_status", ["status"]),

    // Editable content blocks that compose a resource page. Any signed-in
    // user may add/edit blocks on any resource (open-lab moderation model).
    resourceBlocks: defineTable({
      resourceId: v.id("resources"),
      authorId: v.id("users"),
      type: v.union(
        v.literal("image"),
        v.literal("video"),
        v.literal("text"),
        v.literal("gallery"),
        v.literal("slider"),
      ),
      order: v.number(),
      storageId: v.optional(v.id("_storage")),
      url: v.optional(v.string()),
      text: v.optional(v.string()),
      meta: v.optional(
        v.object({
          name: v.optional(v.string()),
          type: v.optional(v.string()),
          size: v.optional(v.number()),
          width: v.optional(v.number()),
          height: v.optional(v.number()),
          caption: v.optional(v.string()),
          ratio: v.optional(v.string()),
          autoplay: v.optional(v.boolean()),
          loop: v.optional(v.boolean()),
          muted: v.optional(v.boolean()),
        }),
      ),
      createdAt: v.number(),
    }).index("by_resource", ["resourceId", "order"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
