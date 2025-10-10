/**
 * @module Models/JoinRequest/Schemas
 * @remarks Defines validation schemas for join request operations using Valibot.
 */
import * as v from 'valibot';

/**
 * Schema for creating a new join request. Sent by a professor.
 */
export const CreateJoinRequestSchema = v.object({
  institutionId: v.pipe(
    v.string('Institution ID is required.'),
    v.minLength(1, 'Institution ID cannot be empty.')
  ),
});

/**
 * Schema for processing a join request. Sent by an institution manager.
 */
export const ProcessJoinRequestSchema = v.object({
  action: v.picklist(
    ['accept', 'reject'],
    "Action must be either 'accept' or 'reject'."
  ),
});

export type CreateJoinRequestType = v.InferOutput<typeof CreateJoinRequestSchema>;
export type ProcessJoinRequestType = v.InferOutput<typeof ProcessJoinRequestSchema>;