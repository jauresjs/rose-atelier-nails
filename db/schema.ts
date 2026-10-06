import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
export const inspirationAttempts=sqliteTable('inspiration_attempts',{
 id:text('id').primaryKey(),owner:text('owner').notNull(),day:text('day').notNull(),created:integer('created').notNull(),guest:integer('guest').notNull()
},t=>[index('inspiration_owner_day').on(t.owner,t.day),index('inspiration_day').on(t.day)]);
export const designs = sqliteTable('designs', {
 id:text('id').primaryKey(), owner:text('owner').notNull(), prompt:text('prompt').notNull(),
 shape:text('shape').notNull(), created:integer('created').notNull(), objectKey:text('object_key')
}, table=>[index('designs_owner_created').on(table.owner,table.created)]);
export const generationAttempts=sqliteTable('generation_attempts',{
 id:text('id').primaryKey(),owner:text('owner').notNull(),day:text('day').notNull(),created:integer('created').notNull(),
 status:text('status').notNull(),requestId:text('request_id'),network:text('network').notNull(),guest:integer('guest').notNull()
},t=>[index('attempt_owner_day').on(t.owner,t.day),index('attempt_day').on(t.day),index('attempt_network_day').on(t.network,t.day),uniqueIndex('attempt_request').on(t.requestId)]);
export const polls=sqliteTable('polls',{
 id:text('id').primaryKey(),owner:text('owner').notNull(),title:text('title').notNull(),created:integer('created').notNull(),closed:integer('closed'),creationKey:text('creation_key').notNull()
},t=>[index('poll_owner_created').on(t.owner,t.created),uniqueIndex('poll_creation_key').on(t.owner,t.creationKey)]);
export const pollProfiles=sqliteTable('poll_profiles',{
 owner:text('owner').primaryKey(),displayName:text('display_name').notNull(),slug:text('slug').notNull()
},t=>[uniqueIndex('poll_profile_slug').on(t.slug)]);
export const pollOptions=sqliteTable('poll_options',{
 pollId:text('poll_id').notNull(),position:integer('position').notNull(),designId:text('design_id').notNull()
},t=>[uniqueIndex('poll_option_position').on(t.pollId,t.position),uniqueIndex('poll_option_design').on(t.pollId,t.designId)]);
export const pollVotes=sqliteTable('poll_votes',{
 id:text('id').primaryKey(),pollId:text('poll_id').notNull(),position:integer('position').notNull(),voter:text('voter').notNull(),created:integer('created').notNull()
},t=>[uniqueIndex('poll_voter').on(t.pollId,t.voter),index('poll_vote_count').on(t.pollId,t.position)]);
