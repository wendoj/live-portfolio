import { defineBackend } from "@aws-amplify/backend";

/**
 * Backend entry point (Amplify Gen 2).
 *
 * Phase 1 deploys an empty backend so the pipeline works end to end.
 * Later phases add, all in eu-west-2:
 *   - AppSync Events API (namespace "room") for live cursors and presence
 *   - API Gateway HTTP API + Lambda for ghost paths and the guestbook
 *   - DynamoDB tables GhostPaths (7-day TTL) and Doodle
 */
defineBackend({});
