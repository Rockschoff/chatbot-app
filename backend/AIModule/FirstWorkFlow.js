const axios = require('axios');

class FirstWorkFlow {
    constructor(model, vectorStore) {
        this.model = model;
        this.vectorStore = vectorStore;
    }

    async getResponse(messages) {
        let text = messages[messages.length - 1].content;
        console.log("getting the relevant files");
        const relevantFiles = await this.vectorStore.getRelevantFiles(text, 10);
        console.log("getting the relevant chunks from the vector store");
        const relevantChunks = await this.vectorStore.getRelevantChunks(text, 10, relevantFiles);
        
        console.log("filtering duplicates from the relevant chunks");
        const filteredChunks = this.removeDuplicateChunks(relevantChunks);

        console.log("compiling the context");
        const context = this.prepareContextWithCitations(filteredChunks);

        const promptTemplate = `
You are an AI assistant that provides information based on the given context. Your responses should be in markdown format and include citations for the information you use.

When you use information from the provided context, add a citation right after the statement. The citation should be a link in the format [file_name](./dashboard/file_name), where file_name is the name of the source file.
Please do not edit the file names in the URLs. If there are spaces in the file names, format them as %20 as usual for a URL.

Here's the context information:

${context}

Now, please respond to the following query:
${text}

### Example Response

Here is an example of how your response should look in markdown format with citations:

**Example Statement:** The AI assistant can provide detailed answers based on the context provided [example_file1](./dashboard/example_file1).

**Another Statement:** The information is sourced from reliable documents [example_file2](./dashboard/example_file2).



Please follow the above format for your response.
`;

        messages[messages.length - 1].content = promptTemplate;
        console.log("getting model response");
        const model_response = await this.model.getResponse(messages);
        return { response: model_response, chunk_info: filteredChunks };
    }

    removeDuplicateChunks(chunks) {
        const seen = new Map();
        chunks.forEach(chunk => {
            if (!seen.has(chunk.chunk_content) || seen.get(chunk.chunk_content).page_number > chunk.page_number) {
                seen.set(chunk.chunk_content, chunk);
            }
        });
        return Array.from(seen.values());
    }

    prepareContextWithCitations(chunks) {
        return chunks.map((chunk, index) => {
            return `[CHUNK${index + 1}]\n${chunk.chunk_content}\n[/CHUNK${index + 1}]\n(Source: ${chunk.file_name}, Page: ${chunk.page_number})`;
        }).join("\n\n");
    }
}

class SecondWorkFlow {
    constructor(model, vectorStore) {
        this.model = model;
        this.vectorStore = vectorStore;
    }

    async getResponse(messages) {
        const lastMessage = messages[messages.length - 1].content;
        console.log("getting document type and keywords from the model");
        const documentInfo = await this.getDocumentInfo(lastMessage);

        console.log("getting the relevant files");
        const relevantFiles = await this.vectorStore.getRelevantFiles(documentInfo, 10);

        console.log("getting the relevant chunks from the vector store");
        const relevantChunks = await this.vectorStore.getRelevantChunks(lastMessage, 10, relevantFiles);

        console.log("filtering duplicates from the relevant chunks");
        const filteredChunks = this.removeDuplicateChunks(relevantChunks);

        console.log("compiling the context");
        const context = this.prepareContextWithCitations(filteredChunks);

        const promptTemplate = `
You are an AI assistant that provides information based on the given context. Your responses should be in markdown format and include citations for the information you use.
When you use information from the provided context, add a citation right after the statement. The citation should be a link in the format [file_name](./dashboard/file_name), where file_name is the name of the source file.
Please do not edit the file names in the URLs. If there are spaces in the file names, format them as %20 as usual for a URL.

Here's the context information:
${context}
Now, please respond to the following query:
${lastMessage}
### Example Response
Here is an example of how your response should look in markdown format with citations:
**Example Statement:** The AI assistant can provide detailed answers based on the context provided [example_file1](./dashboard/example_file1).
**Another Statement:** The information is sourced from reliable documents [example_file2](./dashboard/example_file2).

Please follow the above format for your response.
`;
        messages[messages.length - 1].content = promptTemplate;
        console.log("getting model response");
        const model_response = await this.model.getResponse(messages);
        return { response: model_response, chunk_info: filteredChunks };
    }

    async getDocumentInfo(message) {
        const prompt = `
    Given the following message, please suggest:
    1. Descriptions of documents that would be most relevant to answer this query.
    2. A list of keywords that would be useful for searching these documents.
    
    User's message: "${message}"
    
    Please format your response as follows:
    Document descriptions:
    - Description 1
    - Description 2
    ...
    
    Keywords:
    - Keyword 1
    - Keyword 2
    ...
    `;
        const response = await this.model.getResponse([{ role: "user", content: prompt }]);
        return response + "\n\nUser's message: " + message;
    }

    removeDuplicateChunks(chunks) {
        const seen = new Map();
        chunks.forEach(chunk => {
            if (!seen.has(chunk.chunk_content) || seen.get(chunk.chunk_content).page_number > chunk.page_number) {
                seen.set(chunk.chunk_content, chunk);
            }
        });
        return Array.from(seen.values());
    }

    prepareContextWithCitations(chunks) {
        return chunks.map((chunk, index) => {
            return `[CHUNK${index + 1}]\n${chunk.chunk_content}\n[/CHUNK${index + 1}]\n(Source: ${chunk.file_name}, Page: ${chunk.page_number})`;
        }).join("\n\n");
    }
}

class ThirdWorkFlow {
    constructor(model, vectorStore, apiKey) {
        this.model = model;
        this.vectorStore = vectorStore;
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.tavily.com/search';
    }

    async getResponse(messages) {
        const lastMessage = messages[messages.length - 1].content;
        console.log("getting document type and keywords from the model");
        const documentInfo = await this.getDocumentInfo(lastMessage);

        console.log("getting the relevant files");
        const relevantFiles = await this.vectorStore.getRelevantFiles(documentInfo, 10);

        console.log("getting the relevant chunks from the vector store");
        const relevantChunks = await this.vectorStore.getRelevantChunks(lastMessage, 10, relevantFiles);

        console.log("filtering duplicates from the relevant chunks");
        let filteredChunks = this.removeDuplicateChunks(relevantChunks);

        try {
            console.log("performing web search");
            const searchResults = await this.tavilySearch(lastMessage);
            const searchChunks = this.convertSearchResultsToChunks(searchResults);
            filteredChunks = [...filteredChunks, ...searchChunks];
        } catch (error) {
            console.error('Error performing Tavily search:', error);
            console.log("Continuing with local chunks only");
        }

        console.log("compiling the context");
        const context = this.prepareContextWithCitations(filteredChunks);

        const promptTemplate = `
You are an AI assistant, in Food Safety and Quality Industry, that provides information based on the given context and web search results (if available). Your responses should be in markdown format and include citations for the information you use.

When you use information from the provided context, add a citation right after the statement. The citation should be a link in the format [file_name](./dashboard/file_name), where file_name is the name of the source file or URL.
Please do not edit the file names in the URLs. If there are spaces in the file names, format them as %20 as usual for a URL.

Here's the context information:

${context}

Now, please respond to the following query:
${lastMessage}

### Example Response

Here is an example of how your response should look in markdown format with citations:

**Example Statement:** The AI assistant can provide detailed answers based on the context provided [example_file1](./dashboard/example_file1).

**Another Statement:** According to recent web search results, the information is sourced from reliable online documents [https://example.com/article](https://example.com/article).



Please follow the above format for your response, ensuring to cite all sources used.
`;

        messages[messages.length - 1].content = promptTemplate;
        console.log("getting model response");
        const model_response = await this.model.getResponse(messages);
        return { response: model_response, chunk_info: filteredChunks };
    }

    async getDocumentInfo(message) {
        const prompt = `
Given the following message, please suggest:
1. Descriptions of documents that would be most relevant to answer this query.
2. A list of keywords that would be useful for searching these documents.

User's message: "${message}"

Please format your response as follows:
Document descriptions:
- Description 1
- Description 2
...

Keywords:
- Keyword 1
- Keyword 2
...
`;
        const response = await this.model.getResponse([{ role: "user", content: prompt }]);
        return response + "\n\nUser's message: " + message;
    }

    async tavilySearch(query) {
        const response = await axios.post(this.baseUrl, {
            api_key: this.apiKey,
            query: query+"(search should be related to : Food Safety and Quality + FSQ + FDA + USDA + compliance + safety standards)",
            search_depth: "basic",
            include_images: false,
            include_answer: false,
            include_raw_content: false,
            max_results: 5
        });

        return response.data.results;
    }

    convertSearchResultsToChunks(searchResults) {
        return searchResults.map(result => ({
            chunk_content: result.content,
            file_name: result.url,
            page_number: result.url
        }));
    }

    removeDuplicateChunks(chunks) {
        const seen = new Map();
        chunks.forEach(chunk => {
            if (!seen.has(chunk.chunk_content) || seen.get(chunk.chunk_content).page_number > chunk.page_number) {
                seen.set(chunk.chunk_content, chunk);
            }
        });
        return Array.from(seen.values());
    }

    prepareContextWithCitations(chunks) {
        return chunks.map((chunk, index) => {
            return `[CHUNK${index + 1}]\n${chunk.chunk_content}\n[/CHUNK${index + 1}]\n(Source: ${chunk.file_name}, Page: ${chunk.page_number})`;
        }).join("\n\n");
    }
}

class ThirdWorkFlowNoInternet {
    constructor(model, vectorStore, apiKey) {
        this.model = model;
        this.vectorStore = vectorStore;
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.tavily.com/search';
    }

    async getResponse(messages) {
        const lastMessage = messages[messages.length - 1].content;
        console.log("getting document type and keywords from the model");
        const documentInfo = await this.getDocumentInfo(lastMessage);

        console.log("getting the relevant files");
        const relevantFiles = await this.vectorStore.getRelevantFiles(documentInfo, 10);

        console.log("getting the relevant chunks from the vector store");
        const relevantChunks = await this.vectorStore.getRelevantChunks(lastMessage, 10, relevantFiles);

        console.log("filtering duplicates from the relevant chunks");
        let filteredChunks = this.removeDuplicateChunks(relevantChunks);

        // try {
        //     console.log("performing web search");
        //     const searchResults = await this.tavilySearch(lastMessage);
        //     const searchChunks = this.convertSearchResultsToChunks(searchResults);
        //     filteredChunks = [...filteredChunks, ...searchChunks];
        // } catch (error) {
        //     console.error('Error performing Tavily search:', error);
        //     console.log("Continuing with local chunks only");
        // }

        console.log("compiling the context");
        const context = this.prepareContextWithCitations(filteredChunks);

        const promptTemplate = `
You are an AI assistant, in Food Safety and Quality Industry, that provides information based on the given context and web search results (if available). Your responses should be in markdown format and include citations for the information you use.

When you use information from the provided context, add a citation right after the statement. The citation should be a link in the format [file_name](./dashboard/file_name), where file_name is the name of the source file or URL.
Please do not edit the file names in the URLs. If there are spaces in the file names, format them as %20 as usual for a URL.

Here's the context information:

${context}

Now, please respond to the following query:
${lastMessage}

### Example Response

Here is an example of how your response should look in markdown format with citations:

**Example Statement:** The AI assistant can provide detailed answers based on the context provided [example_file1](./dashboard/example_file1).

**Another Statement:** According to recent web search results, the information is sourced from reliable online documents [https://example.com/article](https://example.com/article).



Please follow the above format for your response, ensuring to cite all sources used.
`;

        messages[messages.length - 1].content = promptTemplate;
        console.log("getting model response");
        const model_response = await this.model.getResponse(messages);
        return { response: model_response, chunk_info: filteredChunks };
    }

    async getDocumentInfo(message) {
        const prompt = `
Given the following message, please suggest:
1. Descriptions of documents that would be most relevant to answer this query.
2. A list of keywords that would be useful for searching these documents.

User's message: "${message}"

Please format your response as follows:
Document descriptions:
- Description 1
- Description 2
...

Keywords:
- Keyword 1
- Keyword 2
...
`;
        const response = await this.model.getResponse([{ role: "user", content: prompt }]);
        return response + "\n\nUser's message: " + message;
    }

    async tavilySearch(query) {
        const response = await axios.post(this.baseUrl, {
            api_key: this.apiKey,
            query: query+"(search should be related to : Food Safety and Quality + FSQ + FDA + USDA + compliance + safety standards)",
            search_depth: "basic",
            include_images: false,
            include_answer: false,
            include_raw_content: false,
            max_results: 5
        });

        return response.data.results;
    }

    convertSearchResultsToChunks(searchResults) {
        return searchResults.map(result => ({
            chunk_content: result.content,
            file_name: result.url,
            page_number: result.url
        }));
    }

    removeDuplicateChunks(chunks) {
        const seen = new Map();
        chunks.forEach(chunk => {
            if (!seen.has(chunk.chunk_content) || seen.get(chunk.chunk_content).page_number > chunk.page_number) {
                seen.set(chunk.chunk_content, chunk);
            }
        });
        return Array.from(seen.values());
    }

    prepareContextWithCitations(chunks) {
        return chunks.map((chunk, index) => {
            return `[CHUNK${index + 1}]\n${chunk.chunk_content}\n[/CHUNK${index + 1}]\n(Source: ${chunk.file_name}, Page: ${chunk.page_number})`;
        }).join("\n\n");
    }
}

class FourthWorkFlow {
    constructor(model, vectorStore) {
        this.model = model;
        this.vectorStore = vectorStore;
    }

    async getResponse(messages) {
        const lastMessage = messages[messages.length - 1].content;
        
        console.log("Breaking down user message into three questions");
        const threeQuestions = await this.breakdownIntoQuestions(lastMessage);

        console.log("Processing each question in parallel");
        const contextPromises = threeQuestions.map(async (question) => {
            const documentInfo = await this.getDocumentInfo(question);
            const relevantFiles = await this.vectorStore.getRelevantFiles(documentInfo, 5);
            const relevantChunks = await this.vectorStore.getRelevantChunks(question, 5, relevantFiles);
            return this.removeDuplicateChunks(relevantChunks);
        });

        const allChunks = await Promise.all(contextPromises);
        const filteredChunks = allChunks.flat();

        console.log("Compiling the context");
        const context = this.prepareContextWithCitations(filteredChunks);

        const promptTemplate = `
You are an AI assistant helping researchers in the Food Safety and Quality Industry. Your responses should be in markdown format and include citations for the information you use. Ensure that all provided information is accurate, relevant, and directly addresses the researcher's needs.

When you use information from the provided context, add a citation right after the statement. The citation should be a link in the format [file_name](./dashboard/file_name), where file_name is the name of the source file.
Please do not edit the file names in the URLs. If there are spaces in the file names, format them as %20 as usual for a URL.

Here's the context information:

${context}

Now, please respond to the following query:
${lastMessage}

Remember to address all aspects of the user's query comprehensively, using the information from the three sub-questions we generated:
${threeQuestions.join("\n")}

Ensure that your final answer is both accurate and relevant to the question.

### Example Response

Here is an example of how your response should look in markdown format with citations:

**Example Statement:** The AI assistant can provide detailed answers based on the context provided [example_file1](./dashboard/example_file1).

**Another Statement:** According to the information in our database, food safety regulations require regular inspections [food_safety_guidelines](./dashboard/food_safety_guidelines).



Please follow the above format for your response, ensuring to cite all sources used.
`;

        messages[messages.length - 1].content = promptTemplate;
        console.log("Getting model response");
        const model_response = await this.model.getResponse(messages);
        return { response: model_response, chunk_info: filteredChunks };
    }

    async breakdownIntoQuestions(message) {
        const prompt = `
Given the following user message, please break it down into three specific questions that, when answered, will most directly help address the user's query. Focus on key aspects of food safety and quality.

User's message: "${message}"

Please format your response as a numbered list of three questions:
1. [Question 1]
2. [Question 2]
3. [Question 3]

Ensure that these questions are directly related to food safety and quality, and cover different aspects of the user's query. Your goal is to aid the researcher in conducting precise, accurate, and relevant research.
`;
        const response = await this.model.getResponse([{ role: "user", content: prompt }]);
        return response.split('\n').filter(line => line.trim().length > 0);
    }

    async getDocumentInfo(question) {
        const prompt = `
Given the following question related to food safety and quality, please suggest:
1. Descriptions of documents that would be most relevant to answer this question.
2. A list of keywords that would be useful for searching these documents.

Question: "${question}"

Please format your response as follows:
Document descriptions:
- Description 1
- Description 2
...

Keywords:
- Keyword 1
- Keyword 2
...

Ensure that your suggestions are geared towards helping researchers conduct precise, accurate, and relevant research in food safety and quality.
`;
        const response = await this.model.getResponse([{ role: "user", content: prompt }]);
        return response + "\n\nQuestion: " + question;
    }

    removeDuplicateChunks(chunks) {
        const seen = new Map();
        chunks.forEach(chunk => {
            if (!seen.has(chunk.chunk_content) || seen.get(chunk.chunk_content).page_number > chunk.page_number) {
                seen.set(chunk.chunk_content, chunk);
            }
        });
        return Array.from(seen.values());
    }

    prepareContextWithCitations(chunks) {
        return chunks.map((chunk, index) => {
            return `[CHUNK${index + 1}]\n${chunk.chunk_content}\n[/CHUNK${index + 1}]\n(Source: ${chunk.file_name}, Page: ${chunk.page_number})`;
        }).join("\n\n");
    }
}

class FifthWorkFlow {
    constructor(model, vectorStore) {
        this.model = model;
        this.vectorStore = vectorStore;
    }

    async getResponse(messages) {
        const lastMessage = messages[messages.length - 1].content;
        
        console.log("Breaking down user message into three questions");
        const threeQuestions = await this.breakdownIntoQuestions(lastMessage);

        console.log("Processing each question in parallel");
        const contextPromises = threeQuestions.map(async (question, index) => {
            const documentInfo = await this.getDocumentInfo(question);
            const relevantFiles = await this.vectorStore.getRelevantFiles(documentInfo, 10);
            const relevantChunks = await this.vectorStore.getRelevantChunks(question, 40, relevantFiles);
            const filteredChunks = await this.filterRelevantChunks(question, relevantChunks);
            return { question, chunks: filteredChunks };
        });

        const allQuestionChunks = await Promise.all(contextPromises);

        console.log("Compiling the context");
        const context = this.prepareContextWithCitations(allQuestionChunks);

        const promptTemplate = `
You are an AI assistant helping researchers in the Food Safety and Quality Industry. Your responses should be in markdown format and include citations for the information you use. Ensure that all provided information is accurate, relevant, and directly addresses the researcher's needs.

When you use information from the provided context, add a citation right after the statement. The citation should be a link in the format [file_name](./dashboard/file_name), where file_name is the name of the source file.
Please do not edit the file names in the URLs. If there are spaces in the file names, format them as %20 as usual for a URL.

Here's the context information:

${context}

Now, please respond to the following query:
${lastMessage}

Remember to address all aspects of the user's query comprehensively, using the information from the three sub-questions we generated:
${threeQuestions.join("\n")}

Ensure that your final answer is both accurate and relevant to the question.

### Example Response

Here is an example of how your response should look in markdown format with citations:

**Example Statement:** The AI assistant can provide detailed answers based on the context provided [example_file1](./dashboard/example_file1).

**Another Statement:** According to the information in our database, food safety regulations require regular inspections [food_safety_guidelines](./dashboard/food_safety_guidelines).



Please follow the above format for your response, ensuring to cite all sources used.
`;

        messages[messages.length - 1].content = promptTemplate;
        console.log("Getting model response");
        const model_response = await this.model.getResponse(messages);
        return { response: model_response, chunk_info: allQuestionChunks.flatMap(qc => qc.chunks) };
    }

    async breakdownIntoQuestions(message) {
        const prompt = `
Given the following user message, please break it down into three specific questions that, when answered, will most directly help address the user's query. Focus on key aspects of food safety and quality.

User's message: "${message}"

Please format your response as a numbered list of three questions:
1. [Question 1]
2. [Question 2]
3. [Question 3]

Ensure that these questions are directly related to food safety and quality, and cover different aspects of the user's query. Your goal is to aid the researcher in conducting precise, accurate, and relevant research.
`;
        const response = await this.model.getResponse([{ role: "user", content: prompt }]);
        return response.split('\n').filter(line => line.trim().length > 0);
    }

    async getDocumentInfo(question) {
        const prompt = `
Given the following question related to food safety and quality, please suggest:
1. Descriptions of documents that would be most relevant to answer this question.
2. A list of keywords that would be useful for searching these documents.

Question: "${question}"

Please format your response as follows:
Document descriptions:
- Description 1
- Description 2
...

Keywords:
- Keyword 1
- Keyword 2
...

Ensure that your suggestions are geared towards helping researchers conduct precise, accurate, and relevant research in food safety and quality.
`;
        const response = await this.model.getResponse([{ role: "user", content: prompt }]);
        return response + "\n\nQuestion: " + question;
    }

    async filterRelevantChunks(question, chunks) {
        const relevantChunks = [];
        for (const chunk of chunks) {
            if (relevantChunks.length >= 6) break;

            const isRelevant = await this.checkChunkRelevance(question, chunk);
            if (isRelevant) {
                relevantChunks.push(chunk);
            }

            if (relevantChunks.length >= 3) break;
        }

        // If we still don't have at least 3 chunks, add the remaining most relevant ones
        if (relevantChunks.length < 3) {
            const remainingChunks = chunks.filter(chunk => !relevantChunks.includes(chunk));
            relevantChunks.push(...remainingChunks.slice(0, 3 - relevantChunks.length));
        }

        return relevantChunks;
    }

    async checkChunkRelevance(question, chunk) {
        const prompt = `
Question: "${question}"

Chunk content: "${chunk.chunk_content}"
File name: ${chunk.file_name}

Is this chunk relevant to answering the question? Does it provide specific, valuable, and accurate information rather than just generic content? Please answer with a simple "Yes" or "No".

Your response should be in the following format:
Relevance: [Yes/No]

Ensure that your assessment helps the researcher in obtaining precise, accurate, and relevant information.
`;

        const response = await this.model.getResponse([{ role: "user", content: prompt }]);
        return response.toLowerCase().includes('yes');
    }

    prepareContextWithCitations(allQuestionChunks) {
        return allQuestionChunks.map(({ question, chunks }, qIndex) => {
            const chunksContext = chunks.map((chunk, index) => {
                return `[CHUNK${qIndex + 1}-${index + 1}]\n${chunk.chunk_content}\n[/CHUNK${qIndex + 1}-${index + 1}]\n(Source: ${chunk.file_name}, Page: ${chunk.page_number})`;
            }).join("\n\n");
            return `Question ${qIndex + 1}: ${question}\n\n${chunksContext}`;
        }).join("\n\n");
    }
}

class SixthWorkFlow {
    constructor(model, vectorStore, apiKey) {
        this.model = model;
        this.vectorStore = vectorStore;
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.tavily.com/search';
    }

    async getResponse(messages) {
        const lastMessage = messages[messages.length - 1].content;
        
        console.log("Breaking down user message into three questions");
        const threeQuestions = await this.breakdownIntoQuestions(lastMessage);

        console.log("Processing each question in parallel");
        const contextPromises = threeQuestions.map(async (question, index) => {
            const documentInfo = await this.getDocumentInfo(question);
            const relevantFiles = await this.vectorStore.getRelevantFiles(documentInfo, 10);
            const relevantChunks = await this.vectorStore.getRelevantChunks(question, 40, relevantFiles);

            console.log(`Performing web search for question ${index + 1}`);
            const searchResults = await this.tavilySearch(question);
            const searchChunks = this.convertSearchResultsToChunks(searchResults);

            const allChunks = [...relevantChunks, ...searchChunks];
            const filteredChunks = await this.filterRelevantChunks(question, allChunks);
            return { question, chunks: filteredChunks };
        });

        const allQuestionChunks = await Promise.all(contextPromises);

        console.log("Compiling the context");
        const context = this.prepareContextWithCitations(allQuestionChunks);

        const promptTemplate = `
You are an AI assistant helping researchers in the Food Safety and Quality Industry. Your responses should be in markdown format and include citations for the information you use.

When you use information from the provided context, add a citation right after the statement. The citation should be a link in the format [file_name](./dashboard/file_name) for local files, or [URL](URL) for web sources.
Please do not edit the file names in the URLs. If there are spaces in the file names, format them as %20 as usual for a URL.

Here's the context information:

${context}

Now, please respond to the following query:
${lastMessage}

Remember to address all aspects of the user's query comprehensively, using the information from the three sub-questions we generated:
${threeQuestions.join("\n")}

### Example Response

Here is an example of how your response should look in markdown format with citations:

**Example Statement:** The AI assistant can provide detailed answers based on the context provided [example_file1](./dashboard/example_file1).

**Another Statement:** According to recent web sources, food safety regulations have been updated [https://example.com/food-safety-update](https://example.com/food-safety-update).

Please follow the above format for your response, ensuring to cite all sources used.
`;

        messages[messages.length - 1].content = promptTemplate;
        console.log("Getting model response");
        const model_response = await this.model.getResponse(messages);
        
        // Deduplicate chunks
        const uniqueChunks = this.deduplicateChunks(allQuestionChunks.flatMap(qc => qc.chunks));
        
        return { response: model_response, chunk_info: uniqueChunks };
    }

    async breakdownIntoQuestions(message) {
        const prompt = `
Given the following user message, please break it down into three specific questions that, when answered, will most directly help address the user's query. Focus on key aspects of food safety and quality.

User's message: "${message}"

Please format your response as a numbered list of three questions:
1. [Question 1]
2. [Question 2]
3. [Question 3]

Ensure that these questions are directly related to food safety and quality, and cover different aspects of the user's query. Your goal is to aid the researcher in conducting precise research.
`;
        const response = await this.model.getResponse([{ role: "user", content: prompt }]);
        return response.split('\n').filter(line => line.trim().length > 0);
    }

    async getDocumentInfo(question) {
        const prompt = `
Given the following question related to food safety and quality, please suggest:
1. Descriptions of documents that would be most relevant to answer this question.
2. A list of keywords that would be useful for searching these documents.

Question: "${question}"

Please format your response as follows:
Document descriptions:
- Description 1
- Description 2
...

Keywords:
- Keyword 1
- Keyword 2
...

Ensure that your suggestions are geared towards helping researchers conduct precise research in food safety and quality.
`;
        const response = await this.model.getResponse([{ role: "user", content: prompt }]);
        return response + "\n\nQuestion: " + question;
    }

    async filterRelevantChunks(question, chunks) {
        const relevantChunks = [];
        for (const chunk of chunks) {
            if (relevantChunks.length >= 6) break;

            const isRelevant = await this.checkChunkRelevance(question, chunk);
            if (isRelevant) {
                relevantChunks.push(chunk);
            }

            if (relevantChunks.length >= 3) break;
        }

        // If we still don't have at least 3 chunks, add the remaining most relevant ones
        if (relevantChunks.length < 3) {
            const remainingChunks = chunks.filter(chunk => !relevantChunks.includes(chunk));
            relevantChunks.push(...remainingChunks.slice(0, 3 - relevantChunks.length));
        }

        return relevantChunks;
    }

    async checkChunkRelevance(question, chunk) {
        const prompt = `
Question: "${question}"

Chunk content: "${chunk.chunk_content}"
Source: ${chunk.file_name}

Is this chunk relevant to answering the question? Does it provide specific, valuable information rather than just generic content? Please answer with a simple "Yes" or "No".

Your response should be in the following format:
Relevance: [Yes/No]

Ensure that your assessment helps the researcher in obtaining precise and relevant information.
`;

        const response = await this.model.getResponse([{ role: "user", content: prompt }]);
        return response.toLowerCase().includes('yes');
    }

    async tavilySearch(query) {
        const response = await axios.post(this.baseUrl, {
            api_key: this.apiKey,
            query: query + " (search should be related to: Food Safety and Quality + FSQ + **FDA ONLY** + compliance + safety standards)",
            search_depth: "basic",
            include_images: false,
            include_answer: false,
            include_raw_content: false,
            max_results: 5
        });

        return response.data.results;
    }

    convertSearchResultsToChunks(searchResults) {
        return searchResults.map(result => ({
            chunk_content: result.content,
            file_name: result.url,
            page_number: 'N/A'
        }));
    }

    prepareContextWithCitations(allQuestionChunks) {
        const uniqueChunks = new Map();
    
        allQuestionChunks.forEach(({ question, chunks }, qIndex) => {
            chunks.forEach((chunk, index) => {
                const key = chunk.chunk_content;
                if (!uniqueChunks.has(key)) {
                    uniqueChunks.set(key, {
                        ...chunk,
                        chunkId: `CHUNK${qIndex + 1}-${index + 1}`,
                        questionIndex: qIndex
                    });
                }
            });
        });
    
        const context = allQuestionChunks.map(({ question }, qIndex) => {
            const questionChunks = Array.from(uniqueChunks.values())
                .filter(chunk => chunk.questionIndex === qIndex)
                .map(chunk => {
                    return `[${chunk.chunkId}]\n${chunk.chunk_content}\n[/${chunk.chunkId}]\n(Source: ${chunk.file_name}, Page: ${chunk.page_number})`;
                })
                .join("\n\n");
    
            return `Question ${qIndex + 1}: ${question}\n\n${questionChunks}`;
        }).join("\n\n");
    
        return context;
    }

    deduplicateChunks(chunks) {
        const uniqueChunks = new Set();
        return chunks.filter(chunk => {
            const key = chunk.chunk_content;
            if (uniqueChunks.has(key)) {
                return false;
            } else {
                uniqueChunks.add(key);
                return true;
            }
        });
    }
}

class SeventhWorkFlow {
    constructor(model, vectorStore, apiKey) {
        this.model = model;
        this.vectorStore = vectorStore;
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.tavily.com/search';
    }

    async getResponse(messages) {
        const lastMessage = messages[messages.length - 1].content;
        
        console.log("Breaking down user message into three questions");
        const threeQuestions = await this.breakdownIntoQuestions(lastMessage);

        console.log("Processing each question in parallel");
        const contextPromises = threeQuestions.map(async (question, index) => {
            const documentInfo = await this.getDocumentInfo(question);
            const relevantFiles = await this.vectorStore.getRelevantFiles(documentInfo, 10);
            const relevantChunks = await this.vectorStore.getRelevantChunks(question, 40, relevantFiles);

            console.log(`Performing web search for question ${index + 1}`);
            const searchResults = await this.tavilySearch(question);
            const searchChunks = this.convertSearchResultsToChunks(searchResults);

            const allChunks = [...relevantChunks, ...searchChunks];
            const filteredChunks = await this.filterRelevantChunks(question, allChunks);
            return { question, chunks: filteredChunks };
        });

        const allQuestionChunks = await Promise.all(contextPromises);

        console.log("Compiling the context");
        const context = this.prepareContextWithCitations(allQuestionChunks);

        const promptTemplate = `
You are an AI assistant helping researchers in the Food Safety and Quality Industry. Your responses should be in markdown format and include citations for the information you use.

When you use information from the provided context, add a citation right after the statement. The citation should be a link in the format [file_name](./dashboard/file_name) for local files, or [URL](URL) for web sources.
Please do not edit the file names in the URLs. If there are spaces in the file names, format them as %20 as usual for a URL.

Here's the context information:

${context}

Now, please respond to the following query:
${lastMessage}

Remember to address all aspects of the user's query comprehensively, using the information from the three sub-questions we generated:
${threeQuestions.join("\n")}

### Example Response

Here is an example of how your response should look in markdown format with citations:

**Example Statement:** The AI assistant can provide detailed answers based on the context provided [example_file1](./dashboard/example_file1).

**Another Statement:** According to recent web sources, food safety regulations have been updated [https://example.com/food-safety-update](https://example.com/food-safety-update).

Please follow the above format for your response, ensuring to cite all sources used.
`;

        messages[messages.length - 1].content = promptTemplate;
        console.log("Getting model response");
        const model_response = await this.model.getResponse(messages);
        
        // Deduplicate chunks
        const uniqueChunks = this.deduplicateChunks(allQuestionChunks.flatMap(qc => qc.chunks));
        
        console.log("Reframing response for researchers");
        const finalResponse = await this.reframeResponseForResearchers(model_response, lastMessage);
        
        return { response: finalResponse, chunk_info: uniqueChunks };
    }

    async breakdownIntoQuestions(message) {
        const prompt = `
Given the following user message, please break it down into three specific questions that, when answered, will most directly help address the user's query. Focus on key aspects of food safety and quality.

User's message: "${message}"

Please format your response as a numbered list of three questions:
1. [Question 1]
2. [Question 2]
3. [Question 3]

Ensure that these questions are directly related to food safety and quality, and cover different aspects of the user's query. Your goal is to aid the researcher in conducting precise research.
`;
        const response = await this.model.getResponse([{ role: "user", content: prompt }]);
        return response.split('\n').filter(line => line.trim().length > 0);
    }

    async getDocumentInfo(question) {
        const prompt = `
Given the following question related to food safety and quality, please suggest:
1. Descriptions of documents that would be most relevant to answer this question.
2. A list of keywords that would be useful for searching these documents.

Question: "${question}"

Please format your response as follows:
Document descriptions:
- Description 1
- Description 2
...

Keywords:
- Keyword 1
- Keyword 2
...

Ensure that your suggestions are geared towards helping researchers conduct precise research in food safety and quality.
`;
        const response = await this.model.getResponse([{ role: "user", content: prompt }]);
        return response + "\n\nQuestion: " + question;
    }

    async filterRelevantChunks(question, chunks) {
        const relevantChunks = [];
        for (const chunk of chunks) {
            if (relevantChunks.length >= 6) break;

            const isRelevant = await this.checkChunkRelevance(question, chunk);
            if (isRelevant) {
                relevantChunks.push(chunk);
            }

            if (relevantChunks.length >= 3) break;
        }

        // If we still don't have at least 3 chunks, add the remaining most relevant ones
        if (relevantChunks.length < 3) {
            const remainingChunks = chunks.filter(chunk => !relevantChunks.includes(chunk));
            relevantChunks.push(...remainingChunks.slice(0, 3 - relevantChunks.length));
        }

        return relevantChunks;
    }

    async checkChunkRelevance(question, chunk) {
        const prompt = `
Question: "${question}"

Chunk content: "${chunk.chunk_content}"
Source: ${chunk.file_name}

Is this chunk relevant to answering the question? Does it provide specific, valuable information rather than just generic content? Please answer with a simple "Yes" or "No".

Your response should be in the following format:
Relevance: [Yes/No]

Ensure that your assessment helps the researcher in obtaining precise and relevant information.
`;

        const response = await this.model.getResponse([{ role: "user", content: prompt }]);
        return response.toLowerCase().includes('yes');
    }

    async tavilySearch(query) {
        const response = await axios.post(this.baseUrl, {
            api_key: this.apiKey,
            query: query + " (search should be related to: Food Safety and Quality + FSQ + **FDA ONLY** + compliance + safety standards)",
            search_depth: "basic",
            include_images: false,
            include_answer: false,
            include_raw_content: false,
            max_results: 5
        });

        return response.data.results;
    }

    convertSearchResultsToChunks(searchResults) {
        return searchResults.map(result => ({
            chunk_content: result.content,
            file_name: result.url,
            page_number: 'N/A'
        }));
    }

    prepareContextWithCitations(allQuestionChunks) {
        const uniqueChunks = new Map();
    
        allQuestionChunks.forEach(({ question, chunks }, qIndex) => {
            chunks.forEach((chunk, index) => {
                const key = chunk.chunk_content;
                if (!uniqueChunks.has(key)) {
                    uniqueChunks.set(key, {
                        ...chunk,
                        chunkId: `CHUNK${qIndex + 1}-${index + 1}`,
                        questionIndex: qIndex
                    });
                }
            });
        });
    
        const context = allQuestionChunks.map(({ question }, qIndex) => {
            const questionChunks = Array.from(uniqueChunks.values())
                .filter(chunk => chunk.questionIndex === qIndex)
                .map(chunk => {
                    return `[${chunk.chunkId}]\n${chunk.chunk_content}\n[/${chunk.chunkId}]\n(Source: ${chunk.file_name}, Page: ${chunk.page_number})`;
                })
                .join("\n\n");
    
            return `Question ${qIndex + 1}: ${question}\n\n${questionChunks}`;
        }).join("\n\n");
    
        return context;
    }

    deduplicateChunks(chunks) {
        const uniqueChunks = new Set();
        return chunks.filter(chunk => {
            const key = chunk.chunk_content;
            if (uniqueChunks.has(key)) {
                return false;
            } else {
                uniqueChunks.add(key);
                return true;
            }
        });
    }

    async reframeResponseForResearchers(response, mainQuestion) {
        const prompt = `
You are an AI assistant helping researchers in the Food Safety and Quality Industry. Given the following response and main question, please reframe the response in a way that would be more pleasing to a researcher.

Main Question: "${mainQuestion}"

Response: "${response}"

Please format your response in markdown and ensure it is comprehensive, clear, and well-structured to meet the needs of a researcher. Directly give the clear response. Do not add any main heading but keep rest of formatting.
You can use more research paper like technical language.
`;

        const reframedResponse = await this.model.getResponse([{ role: "user", content: prompt }]);
        return reframedResponse;
    }
}

class EighthWorkFlow {
    constructor(model, vectorStore, apiKey) {
        this.model = model;
        this.vectorStore = vectorStore;
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.tavily.com/search';
    }

    async getResponse(messages) {
        const lastMessage = messages[messages.length - 1].content;
        console.log("Formulating key questions from the model");
        const keyQuestions = await this.getKeyQuestions(lastMessage);

        console.log("Getting the relevant files");
        const relevantFilesPromise = this.vectorStore.getRelevantFiles(keyQuestions, 10);

        const relevantChunksPromise = relevantFilesPromise.then(relevantFiles => {
            console.log("Getting the relevant chunks from the vector store");
            return this.vectorStore.getRelevantChunks(lastMessage, 25, relevantFiles);
        });

        const tavilySearchPromise = this.tavilySearch(lastMessage).catch(error => {
            console.error('Error performing Tavily search:', error);
            return [];
        });

        const [relevantFiles, relevantChunks, searchResults] = await Promise.all([relevantFilesPromise, relevantChunksPromise, tavilySearchPromise]);

        console.log("Filtering duplicates from the relevant chunks");
        let filteredChunks = this.removeDuplicateChunks(relevantChunks);

        if (searchResults.length > 0) {
            console.log("Converting search results to chunks");
            const searchChunks = this.convertSearchResultsToChunks(searchResults);
            filteredChunks = [...filteredChunks, ...searchChunks];
        }

        console.log("Compiling the context");
        const context = this.prepareContextWithCitations(filteredChunks, keyQuestions);

        const promptTemplate = `
You are an AI assistant specializing in Food Safety and Quality (FSQ), with particular expertise in FDA regulations and guidelines. Your role is to assist researchers and businesses in conducting research and making decisions backed by authoritative citations. Your audience consists of FSQ researchers and industry professionals, and your responses should be tailored to their expertise and interests. Use appropriate scientific terminology and industry jargon when relevant.

Provide information based on the given context and web search results (if available). Your responses should be in markdown format and include inline citations for the information you use.

When using information from the provided context, add a citation immediately after the statement. The citation should be a link in the format [file_name](./dashboard/file_name), where file_name is the name of the source file or URL. Do not edit the file names in the URLs. If there are spaces in the file names, format them as %20 as usual for a URL. If the source is a URL, cite it directly as [URL](URL).

Structure your response in a logical, research-oriented manner. Include a clear reasoning process and indicate the level of certainty for each statement based on the available citations. Use headings, subheadings, and bullet points where appropriate to enhance readability.

Here are EXAMPLES of how to use inline citations in markdown:

1. The FDA recommends that consumers cook ground beef to a minimum internal temperature of 160°F (71°C) [FDA_Food_Safety_Guidelines](./dashboard/FDA_Food_Safety_Guidelines).

2. According to recent studies, proper handwashing can reduce the risk of foodborne illness by up to 50% [CDC_Handwashing_Study](./dashboard/CDC_Handwashing_Study).

3. The Food Safety Modernization Act (FSMA) has significantly impacted preventive controls in food processing facilities [FSMA_Preventive_Controls](./dashboard/FSMA_Preventive_Controls).

4. Here is a LinkedIn for Hudson Trading Group [LinkedIn][https://www.linkedin.com/company/hudsontradinggroup]

5. You can get more information about the FDA from [FDA Official Website](https://www.fda.gov)

Here's the context information:

${context}

Now, please respond to the following query in a manner that would be intellectually stimulating and informative for an FSQ researcher or industry professional:
${lastMessage}

Remember to:
1. Emphasize your expertise in FDA regulations and guidelines.
2. Use appropriate scientific terminology and FSQ jargon.
4. ONLY CITE THE FIlE NAMES AND URL GIVEN TO YOU IN THE CONTEXT INFORMATION
5. Structure your response in a research-oriented manner.
6. Do not include a separate reference section at the end.
7. Use inline citations as demonstrated in the examples above.
9. Only use the citations and sources that are directly relevant to the subject and question, but use them extensively.
10. VERY VERY IMPORTANT:  When using information from the provided context, add a citation immediately after the statement. The citation should be a link in the format [file_name](./dashboard/file_name), where file_name is the name of the source file or URL. Do not edit the file names in the URLs. If there are spaces in the file names, format them as %20 as usual for a URL. If the source is a URL, cite it directly as [URL](URL).
`;

        messages[messages.length - 1].content = promptTemplate;
        console.log("Getting model response");
        const model_response = await this.model.getResponse(messages);
        return { response: model_response, chunk_info: filteredChunks };
    }

    async getKeyQuestions(message) {
        const prompt = `
Given the following message, please suggest:
1. Formulate 3 to 5 key questions that need to be answered to address this query, focusing on FDA regulations and guidelines.
2. the question must include the keywords and descriptions  that will be helpful in search requried fda documentation
3. The question should be relvant to the user query and constructivly build towards the answer.

User's message: "${message}"

Please format your response as follows:
Key questions:
1. Question 1
2. Question 2
...
`;
        const response = await this.model.getResponse([{ role: "user", content: prompt }]);
        return response + "\n\nUser's message: " + message;
    }

    async tavilySearch(query) {
        const response = await axios.post(this.baseUrl, {
            api_key: this.apiKey,
            query: query + " (***FDA ONLY*** OR 'Food and Drug Administration' OR 'food safety compliance' OR 'food safety standards')",
            search_depth: "advanced",
            include_images: false,
            include_answer: false,
            include_raw_content: false,
            max_results: 5,
            domain_list: ["fda.gov", "cdc.gov", "foodsafety.gov", "ecfr.gov"]
        });

        return response.data.results;
    }

    convertSearchResultsToChunks(searchResults) {
        return searchResults.map(result => ({
            chunk_content: result.content,
            file_name: result.url,
            page_number: result.url
        }));
    }

    removeDuplicateChunks(chunks) {
        const seen = new Map();
        chunks.forEach(chunk => {
            if (!seen.has(chunk.chunk_content) || seen.get(chunk.chunk_content).page_number > chunk.page_number) {
                seen.set(chunk.chunk_content, chunk);
            }
        });
        return Array.from(seen.values());
    }

    prepareContextWithCitations(chunks, keyQuestions) {
        const questionsContext = `Relevant Question that can help the response ${keyQuestions}`

        const chunksContext = chunks.map((chunk, index) => {
            return `[CHUNK${index + 1}]\n${chunk.chunk_content}\n[/CHUNK${index + 1}]\n(${chunk.file_name.startsWith("https://")?"URL":"file_name"}: ${chunk.file_name})`;
        }).join("\n\n");

        return `${questionsContext}\n\n${chunksContext}`;
    }
}


module.exports = { FirstWorkFlow ,
     SecondWorkFlow ,
      ThirdWorkFlowNoInternet,
       ThirdWorkFlow,
        FourthWorkFlow ,
         FifthWorkFlow,
          SixthWorkFlow,
        SeventhWorkFlow,
        EighthWorkFlow };