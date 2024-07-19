const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const { connectToDatabase, ...mongodbDAO } = require('./utils/mongodbDAO');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

const corsOptions = {
  origin: ['http://18.191.242.226', 'http://localhost:5173' , 'https://inq-center.innovaqual.com'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.get('/', (req, res) => {
  console.log("test call to the root");
  res.send('Hello, world!');
});

app.get('/data', async (req, res) => {
  try {
    const data = await mongodbDAO.getAllThreads();
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
    await mongodbDAO.addThread(user_id, thread_id, thread_name);
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
    const threads = await mongodbDAO.getThreads(user_id);
    if (threads) {
      res.status(200).json(threads);
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
  const { user_id, thread_id } = req.body;

  if (!user_id || !thread_id) {
    return res.status(400).send('Missing required fields');
  }

  try {
    const success = await mongodbDAO.deleteThread(user_id, thread_id);
    if (success) {
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
    return res.status(400).send('Missing required fields');
  }

  if (!messageContent.senderName || !messageContent.messageTime || !messageContent.messageText) {
    return res.status(400).send('Invalid message content');
  }

  try {
    await mongodbDAO.addMessage(user_id, thread_id, messageContent);
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
    const messages = await mongodbDAO.loadMessages(user_id, thread_id);
    if (messages) {
      res.status(200).json(messages);
    } else {
      res.status(404).send('Messages not found');
    }
  } catch (error) {
    console.error('Error loading messages', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, async () => {
  console.log(`Server running at http://localhost:${port}`);
  try {
    await connectToDatabase();
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
    process.exit(1);
  }
});