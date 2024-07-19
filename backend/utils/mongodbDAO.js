const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

let client;

async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(uri, {
      tls: true,
      tlsAllowInvalidCertificates: true, // Ensure SSL certificates are valid
      tlsAllowInvalidHostnames: true // Ensure hostnames match the certificates
    });

    await client.connect();
    console.log('Connection established.');
  }
  return client;
}

async function getCollection(dbName, collectionName) {
  const client = await connectToDatabase();
  const db = client.db(dbName);
  return db.collection(collectionName);
}

const mongodbDAO = {
  async getAllThreads() {
    const collection = await getCollection('user_threads', 'threads');
    return collection.find({}).toArray();
  },

  async addThread(user_id, thread_id, thread_name) {
    const collection = await getCollection('user_threads', 'threads');
    const user = await collection.findOne({ user_id });

    if (user) {
      return collection.updateOne(
        { user_id },
        { $push: { threads: { thread_id, thread_name } } }
      );
    } else {
      return collection.insertOne({
        user_id,
        threads: [{ thread_id, thread_name }]
      });
    }
  },

  async getThreads(user_id) {
    const collection = await getCollection('user_threads', 'threads');
    const user = await collection.findOne({ user_id });
    return user ? user.threads : null;
  },

  async deleteThread(user_id, thread_id) {
    const threadsCollection = await getCollection('user_threads', 'threads');
    const messagesCollection = await getCollection('user_threads', 'messages');

    const user = await threadsCollection.findOne({ user_id });

    if (user) {
      await threadsCollection.updateOne(
        { user_id },
        { $pull: { threads: { thread_id } } }
      );
      await messagesCollection.deleteMany({ user_id, thread_id });
      return true;
    } else {
      return false;
    }
  },

  async addMessage(user_id, thread_id, messageContent) {
    const collection = await getCollection('user_threads', 'messages');

    const userThread = await collection.findOne({ user_id, thread_id });

    if (userThread) {
      return collection.updateOne(
        { user_id, thread_id },
        { $push: { messages: messageContent } }
      );
    } else {
      return collection.insertOne({
        user_id,
        thread_id,
        messages: [messageContent]
      });
    }
  },

  async loadMessages(user_id, thread_id) {
    const collection = await getCollection('user_threads', 'messages');
    const userThread = await collection.findOne({ user_id, thread_id });
    return userThread ? userThread.messages : null;
  }
};

module.exports = {
    ...mongodbDAO,
    connectToDatabase
  };
