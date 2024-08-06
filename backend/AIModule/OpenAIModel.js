
const { OpenAI } = require('openai');

class OpenAIModel  {
    
    constructor(){
        try{
            this.model = new OpenAI({apiKey: process.env.OPENAI_APIKEY});
            this.model_info = {provider : 'openai' , model_name : "gpt-4o-2024-08-06" }
        }catch(error){
            console.error("Error Initializing OpenAI Model" , error)
        }
        
    }

    async getResponse(messages){
        // get text from vector store along with citations
        //append text to text
        try{
            const response = await this.model.chat.completions.create({
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

module.exports={OpenAIModel}
