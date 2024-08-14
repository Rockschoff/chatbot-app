const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const { connectToDatabase, ...mongodbDAO } = require('./utils/mongodbDAO');
const {OpenAI} = require('openai')
const {v4} = require("uuid")

const app = express();
const port = process.env.PORT || 3000;
const openai_api_key = process.env.OPENAI_APIKEY
const openai_assistant_id = process.env.ASSISTANTID
const openai_vectorstore_id = process.env.VECTOR_STORE

const openai =  new OpenAI({
  api_key : openai_api_key
})
app.use(bodyParser.json());

const corsOptions = {
  origin: ['http://18.191.242.226', 'http://localhost:5173' , 'https://inq-center.innovaqual.com' , "http://localhost:3000"],
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
  // console.log(messageContent)
  if (!messageContent.senderName || !messageContent.messageTime || !messageContent.messageText) {
    return res.status(400).send('Invalid message content');
  }

  if(!messageContent.messageId){
    messageContent.messageId = v4();
  }
  if(!messageContent.metadata){
    messageContent.metadata = {liked : false, disliked : false , comments : "" }
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
      for(var i = 0 ; i < messages.length ; i ++){
          if(!messages[i].messageId){
            messages[i].messageId = v4();
          }
          if(!messages[i].metadata){
            messages[i].metadata = {liked : false , disliked : false , comment : ""}
          }
        }
      res.status(200).json(messages);
    } else {
      res.status(404).send('Messages not found');
    }
  } catch (error) {
    console.error('Error loading messages', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/get-user', async (req, res) => {
  console.log("get-user")
  const { user_id, user_name } = req.body;

  if (!user_id || !user_name) {
    return res.status(400).send('user_id and user_name are required');
  }

  try {
    let user = await mongodbDAO.getUserEntry(user_id);

    if (!user) {
      await mongodbDAO.createUserEntry(user_id, user_name);
      user = await mongodbDAO.getUserEntry(user_id);
    }

    
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching or creating user:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post("/add-message-metadata" , async function(req , res){
  console.log("add-message-metadata")
  const {user_id , thread_id, message_id , metadata} = req.body;

  if(!user_id || !thread_id || !message_id || !metadata){
    console.log("needed params user_id , thread_id, message_id , metadata got :"  ,req.body)
    return res.status(400).send("needed params user_id , thread_id, message_id , metadata got :"  + JSON.stringify(req.body));
  }
  // if(!metadata.liked==null || metadata.disliked==null || metadata.comment==null){
  //   console.log( "Invalid metadata content , needed liked , disliked , comment got :" ,  metadata )
  //   return res.status(400).send("Invalid metadata content , needed liked , disliked , comment got :"  + JSON.stringify(metadata));
  // }
  try{

    const response = await mongodbDAO.addMessageMetadata(user_id , thread_id, message_id , metadata)
    if(response){
      return res.status(200).send("Metadata added sucessfully")
    }else{
      return res.status(500).send("Could not add the metadata succesfully")
    }
    
  }catch(err){
    console.log( "Error occurre4d in updating the metadata", err)
    return res.status(500).send("Internal Server Error" + JSON.stringify(err))
  }
})

app.post("/get-repsonse" , async (res , req)=>{
  console.log("get-repsonse")

})

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