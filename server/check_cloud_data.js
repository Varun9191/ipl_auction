const { MongoClient } = require('mongodb');

const MONGODB_URI = "mongodb+srv://Varun:Varun2006@cluster0.6u8kplx.mongodb.net/?appName=Cluster0";

async function check() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('ipl_auction');
    const collection = db.collection('data');

    const doc = await collection.findOne({ _id: 'players' });
    if (doc) {
      const starc = doc.data['M1'].find(p => p.name === 'Mitchell Starc');
      console.log('--- MITCHELL STARC CLOUD DATA ---');
      console.log(JSON.stringify(starc, null, 2));
    } else {
      console.log('Players document not found in Cloud DB');
    }

  } catch (err) {
    console.error('Error checking cloud data:', err);
  } finally {
    await client.close();
  }
}

check();
