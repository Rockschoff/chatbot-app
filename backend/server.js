const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const { connectToDatabase, ...mongodbDAO } = require('./utils/mongodbDAO');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const XLSX = require('xlsx');
const csv = require('csv-parser');
const { OpenAI } = require('openai');
const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const readdirAsync = promisify(fs.readdir);
const statAsync = promisify(fs.stat);
const crypto = require('crypto')
const {VectorStore} = require("./AIModule/VectorStore.js")
const {OpenAIModel} = require("./AIModule/OpenAIModel")
const WF = require("./AIModule/FirstWorkFlow")

const openaiModel = new OpenAIModel()
// const workflow = new FirstWorkFlow( openaiModel ,  VectorStore)
// const secondWorkflow = new SecondWorkFlow(openaiModel , VectorStore)
// const thirdWorkflow = new WF.ThirdWorkFlow(openaiModel , VectorStore , process.env.TAVILY_API_KEY)
const models = {
  "v1" : new WF.FirstWorkFlow( openaiModel ,  VectorStore),
  "v2" :  new WF.SecondWorkFlow( openaiModel ,  VectorStore),
  "v3" : new WF.ThirdWorkFlow(openaiModel , VectorStore , process.env.TAVILY_API_KEY),
  "v4" : new WF.ThirdWorkFlowNoInternet(openaiModel ,  VectorStore),
  "v5" : new WF.FourthWorkFlow(openaiModel ,  VectorStore),
  "v6" : new WF.FirstWorkFlow(openaiModel ,  VectorStore),
  "v7" : new  WF.SixthWorkFlow(openaiModel , VectorStore , process.env.TAVILY_API_KEY),
}

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
const openai = new OpenAI({ apiKey: process.env.OPENAI_APIKEY });
const corsOptions = {
  origin: ['http://18.191.242.226', 'http://localhost:5173' , 'https://inq-center.innovaqual.com', 'http://localhost:3001', "https://testbot.innovaqual.com" ],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
const upload = multer({ dest: 'uploads/' });
const uploadVectorFile = multer({ dest: 'VectorFile/' });

async function deleteFile(filePath) {
  try {
    await fs.unlink(filePath);
    console.log(`Successfully deleted file: ${filePath}`);
  } catch (error) {
    console.error(`Error deleting file ${filePath}:`, error);
  }
}

async function cleanupFiles(files) {
  for (const file of files) {
    await deleteFile(file.path);
  }
}

// Helper function to read file contents
async function readFileContent(file) {
  const extension = file.originalname.split('.').pop().toLowerCase();
  switch (extension) {
    case 'pdf':
      const pdfData = await pdfParse(file.buffer);
      return pdfData.text;
    case 'docx':
      const result = await mammoth.extractRawText({ path: file.path });
      return result.value;
    case 'ppt':
    case 'pptx':
      // Implement PPT reading logic (requires additional library)
      return 'PPT content extraction not implemented';
    case 'csv':
      return new Promise((resolve, reject) => {
        let content = '';
        fs.createReadStream(file.path)
          .pipe(csv())
          .on('data', (row) => {
            content += JSON.stringify(row) + '\n';
          })
          .on('end', () => {
            resolve(content);
          })
          .on('error', reject);
      });
    case 'xlsx':
      const workbook = XLSX.readFile(file.path);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      return XLSX.utils.sheet_to_csv(sheet);
    default:
      return 'Unsupported file type';
  }
}


app.use(async (error, req, res, next) => {
  if (req.files) {
    await cleanupFiles(req.files);
  }
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
});

// Main API endpoint
app.post('/get-response', upload.array('attachments'), async (req, res) => {
  try {

    console.log(req.body)
    const messageContent = JSON.parse(req.body.messageContent);
    const threadId = req.body.threadId
    const threadName = req.body.threadName
    const modelVersion = req.body.modelVersion
    
    
    
    const files = req.files;

    // Read content from attachments
    const attachmentTexts = await Promise.all(files.map(readFileContent));

    // Cleanup files after reading their content
    await cleanupFiles(files);

    // Add user message to DB
    await mongodbDAO.addMessageToDB(messageContent.userId, threadId, threadName, messageContent);
    
    // Get last 10 messages from the thread
    const thread = await mongodbDAO.getThread(messageContent.userId , threadId);

    const lastMessages = thread ? thread.messages.slice(-10) : [];
    // Prepare messages for OpenAI API
    const attachmentContent = attachmentTexts.join('\n');
    const userMessageContent = `${messageContent.senderName}: ${messageContent.messageText}` + (attachmentContent ? `\n\nAttachment contents:\n${attachmentContent}` : '');
    
    const messages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      ...lastMessages.map(msg => ({ role: 'user', content: msg.messageText })),
      { role: 'user', content: userMessageContent }
    ];

    const workflowResponse = await models[modelVersion].getResponse(messages)
    console.log(workflowResponse)

    // Create new MessageContent object
    const aiResponse = {
      profilePicUrl:'',
      senderName: 'IN-Q Center',
      userId: 'ai-assistant',
      messageTime: new Date().toISOString(),
      messageText: workflowResponse.response,//completionContent,//completion.choices[0].message.content,
      attachments: [],
      citationList: workflowResponse.chunk_info?workflowResponse.chunk_info:[]
    };

    // Add AI response to DB
    await mongodbDAO.addMessageToDB(messageContent.userId, threadId, threadName,  aiResponse);

    // Send response
    res.json({ messageContent: aiResponse, threadId });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function periodicCleanup() {
  const uploadsDir = path.join(__dirname, 'uploads');
  const files = await readdirAsync(uploadsDir);

  for (const file of files) {
    const filePath = path.join(uploadsDir, file);
    const stats = await statAsync(filePath);
    const now = new Date().getTime();
    const endTime = new Date(stats.ctime).getTime() + 24 * 60 * 60 * 1000; // 24 hours

    if (now > endTime) {
      await deleteFile(filePath);
    }
  }
}

setInterval(periodicCleanup, 60 * 60 * 1000);

app.post('/upload-vector-file', uploadVectorFile.single('file'), async (req, res) => {
  try {
    console.log("upload-vector-file")
    const fileId = await VectorStore.uploadFile(req.file);
    res.json({ success: true, fileId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'File upload failed' });
  }
});

app.post('/delete-vector-file', async (req, res) => {
  try {
    console.log("delete-vector-file" , req.body)
    const message = await VectorStore.deleteVectorStoreFile(req.body.fileId);
    res.json({ success: true, message });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'File delete failed' });
  }
});

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
    console.log("not enough params" , req.body)
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

app.get('/get-thread-id', (req, res) => {
  const hash = crypto.randomBytes(32).toString('hex');
  res.json({ threadId: hash });
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