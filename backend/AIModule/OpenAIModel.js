
const { OpenAI } = require('openai');

export const OpenAIModel = {
    model_info : {provider : 'openai' , model_name : "gpt-4o" },
    model : null,
    async initializeModel(){
        try{
            this.model = await OpenAI({apiKey: process.env.OPENAI_APIKEY});
        }catch(error){
            console.error("Error Initializing OpenAI Model" , error)
        }
        
    },

    async getResponse(messages){
        // get text from vector store along with citations
        //append text to text
        try{
            reponse = await this.model.chat.completions.create({
                model : this.model_info.model_name,
                messages : messages
            })
    
            return response.choices[0].message.content;
        }catch(error){
            console.error("Error getting repsonse from Openai", error)
            return "ERROR"
        }
        
    }
}

