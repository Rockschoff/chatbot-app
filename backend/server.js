const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const uri = process.env.MONGODB_URI;

let client;

app.use(bodyParser.json());
const corsOptions = {
  origin: ['http://18.191.242.226'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

async function connectToDatabase() {
  try {
    client = new MongoClient(uri, {
      tls: true,
      tlsAllowInvalidCertificates: true, // Ensure SSL certificates are valid
      tlsAllowInvalidHostnames: true // Ensure hostnames match the certificates
    });
    
    await client.connect();
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
    
    process.exit(1);
  }
}

app.get('/', (req, res) => {
  console.log("test call to the root")
  res.send('Hello, world!');
});

app.get('/data', async (req, res) => {
  try {
    const db = client.db('user_threads'); // Replace with your database name
    const collection = db.collection('threads'); // Replace with your collection name
    const data = await collection.find({}).toArray();
    res.json(data);
  } catch (error) {
    console.error('Error fetching data', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/add-thread', async (req, res) => {
  console.log("add_threads");
  const { user_id, thread_id, thread_name } = req.body;

  if (!user_id || !thread_id || !thread_name) {
    return res.status(400).send('Missing required fields');
  }

  try {
    const db = client.db('user_threads'); // Replace with your database name
    const collection = db.collection('threads'); // Replace with your collection name

    const user = await collection.findOne({ user_id });

    if (user) {
      await collection.updateOne(
        { user_id },
        { $push: { threads: { thread_id, thread_name } } }
      );
    } else {
      await collection.insertOne({
        user_id,
        threads: [{ thread_id, thread_name }]
      });
    }

    res.status(200).send('Thread added successfully');
  } catch (error) {
    console.error('Error adding thread', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/get-threads', async (req, res) => {
  console.log("get-threads");
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).send('Missing required field: user_id');
  }

  try {
    const db = client.db('user_threads');
    const collection = db.collection('threads');

    const user = await collection.findOne({ user_id });

    if (user) {
      res.status(200).json(user.threads);
    } else {
      res.status(404).send('User not found');
    }
  } catch (error) {
    console.error('Error fetching threads', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/delete-thread', async (req, res) => {
  console.log("delete_thread");
  const { user_id, thread_id, thread_name } = req.body;

  if (!user_id || !thread_id || !thread_name) {
    console.log(user_id, thread_id, thread_name);
    return res.status(400).send('Missing required fields');
  }

  try {
    const db = client.db('user_threads');
    const threadsCollection = db.collection('threads');
    const messagesCollection = db.collection('messages');

    const user = await threadsCollection.findOne({ user_id });

    if (user) {
      await threadsCollection.updateOne(
        { user_id },
        { $pull: { threads: { thread_id } } }
      );
      await messagesCollection.deleteMany({ user_id, thread_id });
      res.status(200).send('Thread and its messages deleted successfully');
    } else {
      res.status(404).send('User not found');
    }
  } catch (error) {
    console.error('Error deleting thread', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/add-message', async (req, res) => {
  console.log("add-message");
  const { user_id, thread_id, messageContent } = req.body;

  if (!user_id || !thread_id || !messageContent) {
    console.log("here , some info is missing", user_id, thread_id, messageContent);
    return res.status(400).send('Missing required fields');
  }

  if (!messageContent.senderName || !messageContent.messageTime || !messageContent.messageText) {
    console.log("some format is wrong", messageContent);
    return res.status(400).send('Invalid message content');
  }

  if (!messageContent.profilePicUrl) {
    console.log("no profile picture URL");
  }

  try {
    const db = client.db('user_threads');
    const collection = db.collection('messages');

    const userThread = await collection.findOne({ user_id, thread_id });

    if (userThread) {
      await collection.updateOne(
        { user_id, thread_id },
        { $push: { messages: messageContent } }
      );
    } else {
      await collection.insertOne({
        user_id,
        thread_id,
        messages: [messageContent]
      });
    }

    res.status(200).send('Message added successfully');
  } catch (error) {
    console.error('Error adding message', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/load-messages', async (req, res) => {
  console.log("load_message");
  const { user_id, thread_id } = req.body;

  if (!user_id || !thread_id) {
    return res.status(400).send('Missing required fields');
  }

  try {
    const db = client.db('user_threads');
    const collection = db.collection('messages');

    const userThread = await collection.findOne({ user_id, thread_id });

    if (userThread) {
      res.status(200).json(userThread.messages);
    } else {
      res.status(404).send('Messages not found');
    }
  } catch (error) {
    console.error('Error loading messages', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  connectToDatabase();
});
