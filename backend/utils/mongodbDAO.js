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
    try {
      const collection = await getCollection('user_threads', 'messages');
  
      // Find all threads for the given user_id
      const threads = await collection.find({ user_id }).toArray();
  
      if (threads.length === 0) {
        return null;
      }
  
      // Map the threads to only return thread_id and thread_name
      return threads.map(thread => ({
        threadId: thread.thread_id,
        threadName: thread.thread_name
      }));
    } catch (error) {
      console.error('Error fetching threads:', error);
      return null;
    }
  },

  async deleteThread(user_id, thread_id) {
    try {
      const messagesCollection = await getCollection('user_threads', 'messages');
  
      // Check if the document exists
      const existingThread = await messagesCollection.findOne({ user_id, thread_id });
      if (!existingThread) {
        return false;
      }
  
      // If exists, proceed to delete
      await messagesCollection.deleteMany({ user_id, thread_id });
      return true;
    } catch (error) {
      console.error('Error deleting thread:', error);
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
  },

  async createUserEntry(user_id, user_name) {
    const collection = await getCollection('user_threads', 'users');
    const defaultDate = new Date('2024-01-01T00:00:00Z');
    const user = {
      user_id,
      user_name,
      isPremium: false,
      premium_start_date: defaultDate,
      premium_end_date: defaultDate
    };
    await collection.insertOne(user);
  },

  async getUserEntry(user_id) {
    const collection = await getCollection('user_threads', 'users');
    return collection.findOne({ user_id });
  },

  async updatesUserEntry(user_id, user_name = null, isPremium = null, premium_start_date = null, premium_end_date = null) {
    const collection = await getCollection('user_threads', 'users');
    const updates = {};

    if (user_name !== null) {
      updates.user_name = user_name;
    }
    if (isPremium !== null) {
      updates.isPremium = isPremium;
    }
    if (premium_start_date !== null) {
      updates.premium_start_date = premium_start_date;
    }
    if (premium_end_date !== null) {
      updates.premium_end_date = premium_end_date;
    }

    return collection.updateOne(
      { user_id },
      { $set: updates }
    );
  },

  async addMessageToDB(userId, threadId, threadName, messageContent) {
    try {
      const collection = await getCollection("user_threads", "messages");
  
      // Check if a document with the specified userId and threadId exists
      const existingThread = await collection.findOne({ user_id: userId, thread_id: threadId });
  
      if (existingThread) {
        // If it exists, add the message to the messages array
        await collection.updateOne(
          { user_id: userId, thread_id: threadId },
          { $push: { messages: messageContent } }
        );
      } else {
        // If it doesn't exist, create a new document with the provided parameters
        const newThread = {
          user_id: userId,
          thread_id: threadId,
          thread_name: threadName,
          messages: [messageContent]
        };
        await collection.insertOne(newThread);
      }
    } catch (error) {
      console.error('Error adding message to DB:', error);
      throw error;
    }
  },


  async getThread(userId , threadId){
    try {
      const collection = await getCollection("user_threads" , "messages")
      const thread = await collection.findOne({user_id : userId , thread_id : threadId});
      return thread

    }catch(error){
      console.log("Error fetching threads fromt the DB" , error)
      throw error;
    }
  }
};

module.exports = {
  ...mongodbDAO,
  connectToDatabase
};
