import { z } from 'zod'
import { ObjectId } from "mongodb"

// Validation schemas for campaign files
// Handles creation and updates for hierarchical campaign file system

// validate Mongo ObjectId string
const objectIdString = z
  .string()
  .trim()
  .refine((val) => ObjectId.isValid(val), {
    message: "Invalid ObjectId"
  })

// Base Schema
export const FileBaseSchema = z.object({

  // File title
  title: z
    .string()
    .trim()
    .min(1, "Title cannot be empty")
    .max(200, "Title too long")
    .optional(),

  // parent folder id
  // null = root file
  parentId: objectIdString
    .nullable()
    .optional(),

  // Used by sidebar tree rendering
  nodeType: z
    .enum(["folder", "file"])
    .optional(),


  fileType: z
    .enum(["markdown", "pdf", "image"])
    .optional(),

  visibleTo: z
    .union([z.literal('all'), z.array(z.string())])
    .optional(),
})


// Create File Schema 
export const CreateFileSchema = FileBaseSchema.superRefine((data, ctx) => {

  // default nodeType is "file"
  const nodeType = data.nodeType || "file"

  // folders cannot have a fileType
  if (nodeType === "folder" && data.fileType) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Folders cannot have a fileType",
      path: ["fileType"]
    })
  }

  // files must have a fileType
  if (nodeType === "file" && !data.fileType) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Files must have a fileType",
      path: ["fileType"]
    })
  }
})



// Update File Schema
// Used for PATCH requests, Only validates fields being changed
export const UpdateFileSchema = FileBaseSchema.partial()


// helper: normalize parentId
// Converts "", undefined -> null
export function normalizeFileInput(body) {
  if (!body.parentId) {
    body.parentId = null
  }
  if (!body.nodeType) {
    body.nodeType = "file"
  }
  return body
}