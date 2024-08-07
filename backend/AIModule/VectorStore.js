//Upload file to vector store
// Delete file from vector store
// Retreive from vector store with citations
const { Pinecone } = require('@pinecone-database/pinecone');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { OpenAIEmbeddings } = require('@langchain/openai');
const { v4: uuidv4 } = require('uuid');
const { bucket } = require('./../firebase-config.js');
const pdf = require('pdf-parse');
const fs = require('fs/promises');
const { OpenAI } = require('openai');

const colorLog = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  magenta: (text) => `\x1b[35m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
};

const pc = new Pinecone({ apiKey: process.env.PINECONE_APIKEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_APIKEY });
const fileStorageIndex = pc.index("open-file-storage");
const fileDescriptionIndex = pc.index("file-description");
const embeddings = new OpenAIEmbeddings({ apiKey: process.env.OPENAI_APIKEY, model: "text-embedding-3-large" });

const VectorStore = {
  async  uploadFile(file) {
    if (!file) {
      console.log(colorLog.red('❌ No file provided. Exiting function.'));
      return;
    }
  
    console.log(colorLog.cyan('🚀 Starting file upload process...'));
  
    console.log(colorLog.yellow('📄 Reading PDF file...'));
    const pdfBuffer = await fs.readFile(file.path);
    const pdfData = await pdf(pdfBuffer);
    console.log(colorLog.green(`✅ PDF read successfully. Total pages: ${pdfData.numpages}`));
  
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
  
    console.log(colorLog.yellow('✂️ Splitting PDF into chunks...'));
    const maxPagesPerBatch = 25;
    const fileId = uuidv4();
    console.log(colorLog.magenta(`📎 File ID generated: ${fileId}`));
  
    let allChunks = [];
    const chunkPromises = [];
  
    for (let startPage = 0; startPage < pdfData.numpages; startPage += maxPagesPerBatch) {
      const endPage = Math.min(startPage + maxPagesPerBatch, pdfData.numpages);
      chunkPromises.push(processPageBatch(pdfBuffer, startPage, endPage, splitter, pdfData.numpages));
    }
  
    const chunkBatches = await Promise.all(chunkPromises);
    allChunks = chunkBatches.flat();
  
    console.log(colorLog.yellow('🧠 Creating embeddings for all chunks...'));
    const embeddingsList = await createEmbeddings(allChunks);
  
    // Ensure file name is unique in Firebase
    let filePath = `files/${file.originalname}`;
    let fileName = file.originalname;
    let counter = 1;
  
    while (await fileExistsInFirebase(filePath)) {
      fileName = `${file.originalname.replace(/(\.[\w\d_-]+)$/i, '')}(${counter})${file.originalname.match(/(\.[\w\d_-]+)$/i)[0]}`;
      filePath = `files/${fileName}`;
      counter++;
    }
  
    console.log(colorLog.yellow('🔥 Uploading to Firebase...'));
    const firebaseUploadPromise = bucket.upload(file.path, {
      destination: filePath,
      metadata: {
        contentType: 'application/pdf',
        metadata: { file_id: fileId },
      },
    });
  
    console.log(colorLog.yellow('📝 Generating file description...'));
    let fileDescriptionPrompt = `Provide a detailed description of the content and purpose of the following document. This description should be between 500-700 words and should include keywords and phrases that users might use to search for this document:\n\n${pdfData.text}`;
    if (fileDescriptionPrompt.length > 25000) {
      fileDescriptionPrompt = fileDescriptionPrompt.slice(0, 25000);
    }
  
    let fileDescriptionResponse;
    try {
      fileDescriptionResponse = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: fileDescriptionPrompt }
        ],
        max_tokens: 800,
      });
    } catch (error) {
      console.log(colorLog.red('❌ Error generating file description. Retrying with shorter prompt...'));
      try {
        fileDescriptionResponse = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: fileDescriptionPrompt.slice(0, fileDescriptionPrompt.length / 2) }
          ],
          max_tokens: 800,
        });
      } catch (retryError) {
        console.log(colorLog.red('❌ Error generating file description with shorter prompt. Using fallback description...'));
        const fallbackDescription = fileName + ' ' + pdfData.text.slice(0, 200);
        fileDescriptionResponse = { choices: [{ message: { content: fallbackDescription } }] };
      }
    }
  
    const [fileDescriptionData, firebaseUploadResult] = await Promise.all([fileDescriptionResponse, firebaseUploadPromise]);
    console.log(colorLog.green('✅ Embeddings created and Firebase upload completed successfully'));
  
    console.log(colorLog.yellow('📤 Upserting chunks to Pinecone...'));
    await upsertToPinecone(allChunks, embeddingsList, fileId, fileName);
    console.log(colorLog.green('✅ Chunks upserted successfully'));
  
    const fileDescription = fileDescriptionData.choices[0].message.content;
    console.log(colorLog.yellow('🔤 Creating embedding for file description...'));
    let fileDescriptionEmbedding;
    try {
      fileDescriptionEmbedding = await embeddings.embedDocuments([fileDescription]);
    } catch (error) {
      console.log(colorLog.red('❌ Error generating embedding for file description. Retrying with shorter description...'));
      try {
        fileDescriptionEmbedding = await embeddings.embedDocuments([fileDescription.slice(0, fileDescription.length / 10)]);
      } catch (retryError) {
        console.log(colorLog.red('❌ Error generating embedding with shorter description. Using fallback embedding...'));
        fileDescriptionEmbedding = [new Array(3072).fill(0.1)];
      }
    }
    console.log(colorLog.green('✅ File description embedding created'));
  
    console.log(colorLog.yellow('📤 Upserting file description to Pinecone...'));
    await fileDescriptionIndex.upsert([{
      id: fileId,
      values: fileDescriptionEmbedding[0],
      metadata: {
        file_name: fileName,
        file_id: fileId,
        description: fileDescription,
      },
    }]);
    console.log(colorLog.green('✅ File description upserted successfully'));
  
    console.log(colorLog.yellow('🧹 Cleaning up temporary file...'));
    await fs.unlink(file.path);
    console.log(colorLog.green('✅ Temporary file removed'));
  
    console.log(colorLog.cyan(`🎉 File upload process completed successfully. File ID: ${fileId}`));
    return fileId;
  },

  async deleteVectorStoreFile(fileId) {
    try {
      // Search for the file in Pinecone metadata filtering and delete all the chunks
      console.log("Delteing chunks")
      var page = await fileStorageIndex.listPaginated({prefix : fileId+"#"})
      while(page.vectors.length > 0){
        console.log("Deleting first page" , page.vectors.length , page)
        var pageVectorIds = page.vectors.map((vector) => vector.id);
        await fileStorageIndex.deleteMany(pageVectorIds)
        if(!page.pagination){
          break
        }
        page = await fileStorageIndex.listPaginated({ prefix: fileId+"#", paginationToken: page.pagination.next });
      }
      console.log("Deleting Descriptions")
      fileDescriptionIndex.deleteOne(fileId)

      console.log("Deleting File")
      const [files] = await bucket.getFiles({
          prefix: 'files/',
      });
      let deletedFileName = null;

        for (const file of files) {
            const [metadata] = await file.getMetadata();
            if (metadata.metadata && metadata.metadata.file_id === fileId) {
                deletedFileName = file.name;
                await file.delete();
                console.log(`Deleted file from Firebase Storage: ${file.name}`);
                break;
            }
        }
        if (!deletedFileName) {
          console.log(`File with ID ${fileId} not found in Firebase Storage`);
      }

      return { success: true, file_name:deletedFileName , file_id:fileId };
    } catch (error) {
      console.error('Error deleting vectors and file:', error);
      throw error;
    }
  },

  async getRelevantFiles(queryText , num_files=10) {
    // Embed the query text
    
    const queryEmbedding = await embeddings.embedDocuments([queryText]);
    
    // Search for relevant files in the fileDescriptionIndex
    const searchResult = await fileDescriptionIndex.query({
      vector: queryEmbedding[0],
      topK: num_files, // Retrieve top 10 relevant files
      includeMetadata: true,
    });

    // Extract relevant files from the search result
    const relevantFiles = searchResult.matches.map(match => ({
      file_id: match.metadata.file_id,
      file_name: match.metadata.file_name,
      description: match.metadata.description,
    }));

    return relevantFiles;
  },

  async getRelevantChunks(queryText, num_chunks = 10, files = []) {
    // Embed the query text
    
    const queryEmbedding = await embeddings.embedDocuments([queryText]);
  
    let filter = {};
  
    // If files array is not empty, construct the filter for file IDs and file names
    if (files.length > 0) {
      const fileIds = files.map(file => file.file_id);
      const fileNames = files.map(file => file.file_name);
  
      filter = {
        "$or": [
          { file_id: { $in: fileIds } },
          { file_name: { $in: fileNames } }
        ]
      };
    }
  
    // Search for relevant chunks in the fileStorageIndex
    const searchResult = await fileStorageIndex.query({
      vector: queryEmbedding[0],
      topK: num_chunks, // Retrieve top 'num_chunks' relevant chunks
      includeMetadata: true,
      filter: filter,
    });
  
    // Extract relevant chunks from the search result
    const relevantChunks = searchResult.matches.map(match => ({
      chunk_content: match.metadata.chunk_content,
      file_name: match.metadata.file_name,
      page_number: match.metadata.page_number,
    }));
  
    return relevantChunks;
  }
  
};

async function fileExistsInFirebase(filePath) {
  try {
    const [exists] = await bucket.file(filePath).exists();
    return exists;
  } catch (error) {
    console.log(colorLog.red(`❌ Error checking file existence in Firebase: ${error.message}`));
    return false;
  }
}

async function processPageBatch(pdfBuffer, startPage, endPage, splitter, totalPages) {
  const batchChunks = [];
  for (let pageNum = startPage; pageNum < endPage; pageNum++) {
    const pageText = await pdf(pdfBuffer, { max: pageNum + 1, min: pageNum }).then(data => data.text);
    const pageChunks = await splitter.createDocuments([pageText]);
    batchChunks.push(...pageChunks.map(chunk => ({
      ...chunk,
      metadata: { ...chunk.metadata, pageNumber: pageNum + 1 }
    })));
    console.log(colorLog.blue(`   Page ${pageNum + 1}/${totalPages} processed`));
  }
  return batchChunks;
}

async function createEmbeddings(chunks) {
  const batchSize = 100;
  const embeddingPromises = [];
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batchChunks = chunks.slice(i, i + batchSize);
    const batchContents = batchChunks.map(chunk => truncateContent(chunk.pageContent));
    embeddingPromises.push(embeddings.embedDocuments(batchContents).catch(error => {
      console.log(colorLog.red(`❌ Error creating embeddings for batch ${i / batchSize + 1}: ${error.message}`));
      return [];
    }));
  }
  const embeddingResults = await Promise.all(embeddingPromises);
  console.log(colorLog.green('✅ All embeddings created successfully'));
  return embeddingResults.flat().filter(embedding => embedding.length > 0);
}

function truncateContent(content) {
  const words = content.split(/\s+/);
  const maxWords = Math.floor((8176 / 100) * 75); // Approximately 6132 words
  if (words.length <= maxWords) {
    return content;
  }
  return words.slice(0, maxWords).join(' ');
}

async function upsertToPinecone(chunks, embeddingsList, fileId, fileName) {
  const batchSize = 100;
  const upsertPromises = [];
  let consecutiveFailures = 0;

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batchChunks = chunks.slice(i, i + batchSize);
    const batchEmbeddings = embeddingsList.slice(i, i + batchSize);
    const batchVectors = batchChunks.map((chunk, index) => ({
      id: `${fileId}#${i + index}`,
      values: batchEmbeddings[index] || new Array(3072).fill(0.1), // Use fallback embedding if error occurred
      metadata: {
        file_name: fileName,
        chunk_content: chunk.pageContent,
        page_number: chunk.metadata.pageNumber,
        file_id: fileId,
      },
    }));

    // Function to perform upsert with retry logic
    const upsertWithRetry = async (vectors) => {
      try {
        await fileStorageIndex.upsert(vectors);
        console.log(colorLog.green(`✅ Upsert for batch starting at index ${i} successful`));
        consecutiveFailures = 0; // Reset consecutive failures on success
      } catch (error) {
        console.log(colorLog.red(`❌ Error upserting batch starting at index ${i}: ${error.message}. Retrying in 3.3 seconds...`));
        await new Promise(resolve => setTimeout(resolve, 3300)); // Wait for 3.3 seconds
        try {
          await fileStorageIndex.upsert(vectors);
          console.log(colorLog.green(`✅ Upsert retry for batch starting at index ${i} successful`));
          consecutiveFailures = 0; // Reset consecutive failures on success
        } catch (retryError) {
          console.log(colorLog.red(`❌ Retry failed for batch starting at index ${i}: ${retryError.message}`));
          consecutiveFailures++;
          if (consecutiveFailures >= 5) {
            throw new Error(`❌ Upsert failed consecutively 5 times. Aborting further upserts.`);
          }
        }
      }
    };

    upsertPromises.push(upsertWithRetry(batchVectors));
  }

  // Wait for all upsert operations to complete in parallel
  await Promise.all(upsertPromises);
  console.log(colorLog.green('✅ All Pinecone upserts completed'));
}

module.exports = {
  VectorStore
};
