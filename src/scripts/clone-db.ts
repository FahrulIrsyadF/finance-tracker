import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '../lib/db/schema';
import { config } from 'dotenv';
import fs from 'fs';

// Muat variabel lingkungan
config({ path: '.env.local' });

async function cloneDatabase() {
  console.log('🔄 Memulai proses clone database dari Turso ke lokal (local.db)...');

  const remoteUrl = process.env.TURSO_DATABASE_URL;
  const remoteToken = process.env.TURSO_AUTH_TOKEN;

  if (!remoteUrl) {
    console.error('❌ TURSO_DATABASE_URL harus diset di .env.local');
    process.exit(1);
  }

  // Koneksi ke Remote (Turso)
  const remoteClient = createClient({
    url: remoteUrl,
    authToken: remoteToken,
  });
  const remoteDb = drizzle(remoteClient, { schema });

  // Koneksi ke Lokal
  const localUrl = process.env.TURSO_DATABASE_URL_DEV || 'file:local.db';
  const localToken = process.env.TURSO_AUTH_TOKEN_DEV;

  if (!localUrl.startsWith('file:')) {
     console.log('⚠️ TURSO_DATABASE_URL_DEV bukan file lokal, tapi kita akan lanjutkan clone ke URL tersebut.');
  }

  const localClient = createClient({
    url: localUrl,
    authToken: localToken,
  });
  const localDb = drizzle(localClient, { schema });

  try {
    // 1. Wallets
    console.log('📦 Cloning Wallets...');
    const walletsData = await remoteDb.select().from(schema.wallets);
    if (walletsData.length > 0) {
      await localDb.insert(schema.wallets).values(walletsData).onConflictDoNothing();
      console.log(`✅ ${walletsData.length} wallets berhasil diclone.`);
    } else {
      console.log('⚠️ Wallets kosong.');
    }

    // 2. Categories
    console.log('📦 Cloning Categories...');
    const categoriesData = await remoteDb.select().from(schema.categories);
    if (categoriesData.length > 0) {
      await localDb.insert(schema.categories).values(categoriesData).onConflictDoNothing();
      console.log(`✅ ${categoriesData.length} categories berhasil diclone.`);
    } else {
      console.log('⚠️ Categories kosong.');
    }

    // 3. Transactions
    console.log('📦 Cloning Transactions...');
    const transactionsData = await remoteDb.select().from(schema.transactions);
    if (transactionsData.length > 0) {
      await localDb.insert(schema.transactions).values(transactionsData).onConflictDoNothing();
      console.log(`✅ ${transactionsData.length} transactions berhasil diclone.`);
    } else {
      console.log('⚠️ Transactions kosong.');
    }

    // 4. Tags
    console.log('📦 Cloning Tags...');
    const tagsData = await remoteDb.select().from(schema.tags);
    if (tagsData.length > 0) {
      await localDb.insert(schema.tags).values(tagsData).onConflictDoNothing();
      console.log(`✅ ${tagsData.length} tags berhasil diclone.`);
    } else {
      console.log('⚠️ Tags kosong.');
    }

    // 5. Transaction Tags
    console.log('📦 Cloning Transaction Tags...');
    const transactionTagsData = await remoteDb.select().from(schema.transactionTags);
    if (transactionTagsData.length > 0) {
      await localDb.insert(schema.transactionTags).values(transactionTagsData).onConflictDoNothing();
      console.log(`✅ ${transactionTagsData.length} transaction_tags berhasil diclone.`);
    } else {
      console.log('⚠️ Transaction Tags kosong.');
    }

    // 6. Import Logs
    console.log('📦 Cloning Import Logs...');
    const importLogsData = await remoteDb.select().from(schema.importLogs);
    if (importLogsData.length > 0) {
      await localDb.insert(schema.importLogs).values(importLogsData).onConflictDoNothing();
      console.log(`✅ ${importLogsData.length} import_logs berhasil diclone.`);
    } else {
      console.log('⚠️ Import Logs kosong.');
    }

    console.log('🎉 Clone database selesai! Database development siap digunakan.');

  } catch (error) {
    console.error('❌ Terjadi kesalahan saat clone database:', error);
  } finally {
    remoteClient.close();
    localClient.close();
    process.exit(0);
  }
}

cloneDatabase();
