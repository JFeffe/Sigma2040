import {index, integer, sqliteTable, text} from 'drizzle-orm/sqlite-core';

export const relayRooms=sqliteTable('relay_rooms',{
 id:text('id').primaryKey(),
 inviteHash:text('invite_hash').notNull(),
 hostHash:text('host_hash').notNull(),
 hostSeen:integer('host_seen').notNull(),
 createdAt:integer('created_at').notNull()
});

export const relayMessages=sqliteTable('relay_messages',{
 id:integer('id').primaryKey({autoIncrement:true}),
 roomId:text('room_id').notNull().references(()=>relayRooms.id,{onDelete:'cascade'}),
 target:text('target').notNull(),
 sender:text('sender').notNull(),
 payload:text('payload').notNull(),
 createdAt:integer('created_at').notNull()
},table=>[index('idx_relay_messages_target').on(table.roomId,table.target,table.id)]);
