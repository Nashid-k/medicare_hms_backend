require('dotenv').config();
const mongoose = require('mongoose');

async function migrate(options = {}) {
  const sourceUri = options.sourceUri || process.env.LOCAL_MONGO_URI || 'mongodb://127.0.0.1:27017/medicare_hms';
  const targetUri = options.targetUri || process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!targetUri) {
    console.error('❌ Target MongoDB URI not specified in MONGODB_URI or MONGO_URI.');
    process.exit(1);
  }

  console.log(`Connecting to Source MongoDB: ${sourceUri}`);
  const sourceConn = await mongoose.createConnection(sourceUri).asPromise();
  console.log('✅ Connected to Source MongoDB.');

  const sourceCollections = await sourceConn.db.listCollections().toArray();
  console.log(`Found ${sourceCollections.length} collections in source.`);

  console.log(`\nConnecting to Target MongoDB: ${targetUri}`);
  const targetConn = await mongoose.createConnection(targetUri).asPromise();
  console.log(`✅ Connected to Target MongoDB (${targetConn.db.databaseName}).`);

  console.log('\n--- Migrating Collections ---');
  for (const collInfo of sourceCollections) {
    const collName = collInfo.name;
    const sourceColl = sourceConn.db.collection(collName);
    const docs = await sourceColl.find({}).toArray();
    const indexes = await sourceColl.indexes();

    console.log(`Collection "${collName}": read ${docs.length} documents.`);

    const targetColl = targetConn.db.collection(collName);

    // Clear existing target collection
    await targetColl.deleteMany({});

    if (docs.length > 0) {
      await targetColl.insertMany(docs);
    }

    // Replicate indexes
    for (const idx of indexes) {
      if (idx.name === '_id_') continue;
      const indexOptions = { name: idx.name };
      if (idx.unique) indexOptions.unique = true;
      if (idx.sparse) indexOptions.sparse = true;
      try {
        await targetColl.createIndex(idx.key, indexOptions);
      } catch (idxErr) {
        console.warn(`  ⚠️ Index "${idx.name}" warning on "${collName}": ${idxErr.message}`);
      }
    }

    const verifiedCount = await targetColl.countDocuments();
    console.log(`  -> Successfully migrated ${verifiedCount} documents to target "${collName}".`);
  }

  await targetConn.close();
  await sourceConn.close();

  console.log('\n🎉 Data migration completed successfully!');
}

if (require.main === module) {
  migrate().catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  });
}

module.exports = { migrate };
