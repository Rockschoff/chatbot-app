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

When you use information from the provided context, add a citation right after the statement. The citation should be a link in the format [file_name](./file_name), where file_name is the name of the source file.

At the end of your response, include a "References" section that lists all the citations used, with each citation linking to the corresponding file.

Here's the context information:

${context}

Now, please respond to the following query:
${text}

### Example Response

Here is an example of how your response should look in markdown format with citations:

**Example Statement:** The AI assistant can provide detailed answers based on the context provided [example_file1](./example_file1).

**Another Statement:** The information is sourced from reliable documents [example_file2](./example_file2).

### References

[^example_file1]: [example_file1](./example_file1)
[^example_file2]: [example_file2](./example_file2)

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
When you use information from the provided context, add a citation right after the statement. The citation should be a link in the format [file_name](./file_name), where file_name is the name of the source file.
At the end of your response, include a "References" section that lists all the citations used, with each citation linking to the corresponding file.
Here's the context information:
${context}
Now, please respond to the following query:
${lastMessage}
### Example Response
Here is an example of how your response should look in markdown format with citations:
**Example Statement:** The AI assistant can provide detailed answers based on the context provided [example_file1](./example_file1).
**Another Statement:** The information is sourced from reliable documents [example_file2](./example_file2).
### References
[^example_file1]: [example_file1](./example_file1)
[^example_file2]: [example_file2](./example_file2)
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

When you use information from the provided context, add a citation right after the statement. The citation should be a link in the format [file_name](./file_name), where file_name is the name of the source file or URL.

At the end of your response, include a "References" section that lists all the citations used, with each citation linking to the corresponding file or URL. Finally always make sure that URL and content that you include in the response does not contain random URLs that are not related to the question

Here's the context information:

${context}

Now, please respond to the following query:
${lastMessage}

### Example Response

Here is an example of how your response should look in markdown format with citations:

**Example Statement:** The AI assistant can provide detailed answers based on the context provided [example_file1](./example_file1).

**Another Statement:** According to recent web search results, the information is sourced from reliable online documents [https://example.com/article](https://example.com/article).

### References

[^example_file1]: [example_file1](./example_file1)
[^https://example.com/article]: [https://example.com/article](https://example.com/article)

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
module.exports = { FirstWorkFlow, SecondWorkFlow, ThirdWorkFlow };