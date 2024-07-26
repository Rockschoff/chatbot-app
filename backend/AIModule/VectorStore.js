//Upload file to vector store
// Delete file from vector store
// Retreive from vector store with citations
const { Pinecone } = require('@pinecone-database/pinecone');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { OpenAIEmbeddings } = require('@langchain/openai');
const { v4: uuidv4 } = require('uuid');
const { bucket } = require('/Users/rishizen/Documents/AWS/svelte-kit demo/chatbot/backend/firebase-config.js');
const pdf = require('pdf-parse');
const fs = require('fs/promises');
const { OpenAI } = require('openai');

const pc = new Pinecone({ apiKey: process.env.PINECONE_APIKEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_APIKEY });
const fileStorageIndex = pc.index("open-file-storage");
const fileDescriptionIndex = pc.index("file-description");

const VectorStore = {
  async uploadFile(file) {
    if (!file) {
      return;
    }

    // Read PDF file
    console.log("Reading the pdf file")
    const pdfBuffer = await fs.readFile(file.path);
    const pdfData = await pdf(pdfBuffer);
    const embeddings = new OpenAIEmbeddings({ apiKey: process.env.OPENAI_APIKEY , model:"text-embedding-3-large"});

    
    // Initialize the text splitter
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    console.log("splitting to chinks")
    // Process each page
    let allChunks = [];
    for (let i = 0; i < pdfData.numpages; i++) {
      console.log(i+1 , "/" , pdfData.numpages)
      const pageText = await new Promise((resolve) => {
        pdf(pdfBuffer, { max: i + 1, min: i }).then(data => resolve(data.text));
      });

      const pageChunks = await splitter.createDocuments([pageText]);
      const pageChunksWithNumber = pageChunks.map(chunk => ({
        ...chunk,
        metadata: { ...chunk.metadata, pageNumber: i + 1 }
      }));

      allChunks = allChunks.concat(pageChunksWithNumber);
    }

    console.log("creating embeddings")
    // Embed the chunks using OpenAI embedding
    
    const embeddedChunks = await embeddings.embedDocuments(allChunks.map(chunk => chunk.pageContent));

    // Generate a unique file ID
    const fileId = uuidv4();

    console.log("upserting")
    // Upsert the file to the Pinecone index
    const vectors = allChunks.map((chunk, index) => ({
      id: `${fileId}#${index}`,
      values: embeddedChunks[index],
      metadata: {
        file_name: file.originalname,
        chunk_content: chunk.pageContent,
        page_number: chunk.metadata.pageNumber,
        file_id : fileId
      },
    }));

    await fileStorageIndex.upsert(vectors);
    console.log("uploading to firebase")
    // Upload the file to Firebase Storage
    const filePath = `files/${file.originalname}`;
    await bucket.upload(file.path, {
      destination: filePath,
      metadata: {
          contentType: 'application/pdf',
          metadata: {
              file_id: fileId,
          },
      },
  });

    console.log("generating file descirption")
    // Generate the file description using OpenAI
    const fileDescriptionPrompt = `Provide a detailed description of the content and purpose of the following document. This description should be between 500-700 words and should include keywords and phrases that users might use to search for this document:\n\n${pdfData.text}`;
    const fileDescriptionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages:[{ role: 'system', content: 'You are a helpful assistant.' },{ role: 'user', content: fileDescriptionPrompt }] ,
      max_tokens: 800,
    });
    const fileDescription = fileDescriptionResponse.choices[0].message.content;

    // Embed the file description
    const fileDescriptionEmbedding = await embeddings.embedDocuments([fileDescription]);

    // Upsert the file description to the fileDescriptionIndex
    const fileDescriptionVector = {
      id: fileId,
      values: fileDescriptionEmbedding[0],
      metadata: {
        file_name: file.originalname,
        file_id: fileId,
        description: fileDescription,
      },
    };

    console.log("upsearing descriptions")
    await fileDescriptionIndex.upsert([fileDescriptionVector]);

    // Clean up the temporary file
    await fs.unlink(file.path);

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
          throw new Error(`File with ID ${fileId} not found in Firebase Storage`);
      }

      return { success: true, file_name:deletedFileName , file_id:fileId };
    } catch (error) {
      console.error('Error deleting vectors and file:', error);
      throw error;
    }
  },

  async getRelevantFiles(queryText , num_files=10) {
    // Embed the query text
    const embeddings = new OpenAIEmbeddings();
    const queryEmbedding = await embeddings.embedDocument(queryText);

    // Search for relevant files in the fileDescriptionIndex
    const searchResult = await fileDescriptionIndex.query({
      query: queryEmbedding,
      top_k: num_files, // Retrieve top 10 relevant files
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
    const embeddings = new OpenAIEmbeddings();
    const queryEmbedding = await embeddings.embedDocument(queryText);
  
    let filter = {};
  
    // If files array is not empty, construct the filter for file IDs and file names
    if (files.length > 0) {
      const fileIds = files.map(file => file.file_id);
      const fileNames = files.map(file => file.file_name);
  
      filter = {
        or: [
          { file_id: { $in: fileIds } },
          { file_name: { $in: fileNames } }
        ]
      };
    }
  
    // Search for relevant chunks in the fileStorageIndex
    const searchResult = await fileStorageIndex.query({
      query: queryEmbedding,
      top_k: num_chunks, // Retrieve top 'num_chunks' relevant chunks
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

module.exports = {
  VectorStore
};
