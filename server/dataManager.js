const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const dataDir = path.join(__dirname, '..', 'data');
const getFilePath = (fileName) => path.join(dataDir, fileName);

// In-memory cache
const cache = {};
let db = null;
const MONGODB_URI = process.env.MONGODB_URI;

const initCache = async () => {
    if (MONGODB_URI) {
        try {
            const client = new MongoClient(MONGODB_URI);
            await client.connect();
            db = client.db('ipl_auction');
            console.log('📡 Connected to Cloud Database (MongoDB)');
            
            // Load all documents from DB into cache
            const collections = ['players.json', 'teams.json', 'state.json', 'config.json'];
            for (const file of collections) {
                const collectionName = file.replace('.json', '');
                const doc = await db.collection('data').findOne({ _id: collectionName });
                if (doc) {
                    cache[file] = doc.data;
                } else {
                    // Fallback to local file if not in DB yet
                    console.log(`⚠️ Document ${collectionName} not found in DB, falling back to local file.`);
                    cache[file] = readLocalFile(file);
                }
            }
        } catch (err) {
            console.error('❌ Failed to connect to Cloud Database:', err);
            process.exit(1);
        }
    } else {
        ['players.json', 'teams.json', 'state.json', 'config.json'].forEach(file => {
            cache[file] = readLocalFile(file);
        });
        console.log('✅ Local Data cache initialized');
    }
};

const readLocalFile = (fileName) => {
    try {
        const rawData = fs.readFileSync(getFilePath(fileName), 'utf-8');
        return JSON.parse(rawData);
    } catch (err) {
        console.error(`Error reading local ${fileName}:`, err);
        return null;
    }
};

const readData = (fileName) => {
    return cache[fileName] || null;
};

const writeData = async (fileName, data) => {
    cache[fileName] = data;
    
    if (db) {
        try {
            const collectionName = fileName.replace('.json', '');
            await db.collection('data').updateOne(
                { _id: collectionName },
                { $set: { data: data } },
                { upsert: true }
            );
        } catch (err) {
            console.error(`Error writing to Cloud DB (${fileName}):`, err);
        }
    } else {
        try {
            fs.writeFileSync(getFilePath(fileName), JSON.stringify(data, null, 2));
        } catch (err) {
            console.error(`Error writing to local ${fileName}:`, err);
        }
    }
};

module.exports = {
    readData,
    writeData,
    initCache
};
