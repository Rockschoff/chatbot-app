


export const FirstWorkFlow = {

    constructor(model , vectorStore){
        this.model = model
        this.vectorStore = vectorStore
    },

    getResponse(messages){
        
        let text = messages[messages.length - 1].content

        console.log("getting the relvant files")
        const relevantFiles = this.vectorStore.getRelevantFiles(text , num_files = 10)

        console.log("getting the relevant chunks from the vector store")
        const relevantChunks = this.vectorStore.getRelevantChunks(text , num_chunks=10 , file=relevantFiles)

        console.log("compliging the context")
        const context = relevantChunks.map((obj)=>{return obj.chunk_content}).join(" ")
        
        messages[messages.length - 1].content += " Official Documentations : " + context

        console.log("getting model response")
        const model_repsonse = this.model.getResponse(messages);

        return {response : model_repsonse , chunk_info : relevantChunks}
        
    }
    
}