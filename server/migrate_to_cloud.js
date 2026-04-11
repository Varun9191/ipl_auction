const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Fill this with the connection string from MongoDB Atlas
const MONGODB_URI = process.argv[2] || process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Error: Please provide the MongoDB Connection String as an argument.');
  console.log('Usage: node migrate_to_cloud.js "mongodb+srv://..."');
  process.exit(1);
}

const dataDir = path.join(__dirname, '..', 'data');

async function migrate() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('ipl_auction');
    const collection = db.collection('data');

    const files = ['players.json', 'teams.json', 'state.json', 'config.json'];

    for (const file of files) {
      console.log(`🚀 Migrating ${file}...`);
      const filePath = path.join(dataDir, file);
      const rawData = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(rawData);
      const collectionName = file.replace('.json', '');

      await collection.updateOne(
        { _id: collectionName },
        { $set: { data: data } },
        { upsert: true }
      );
      console.log(`✅ ${file} successfully migrated to cloud!`);
    }

    console.log('\n✨ ALL DATA MIGRATED SUCCESSFULLY! ✨');
    console.log('You can now deploy your server to Render/Railway.');

  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await client.close();
  }
}

migrate();
