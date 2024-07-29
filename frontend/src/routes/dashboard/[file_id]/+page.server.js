import {error} from "@sveltejs/kit"
import {OpenAI} from 'openai'

const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_APIKEY,
    dangerouslyAllowBrowser: true
});

export async function load({params}){
    console.log(params)
    let file
    // try{
    //     file = await openai.files.retrieve(params.file_id);
    // }catch(e){
    //     console.log("Error Getting file from openai" , e)
    // }
    
    // console.log("found the file" , file)
    // if (!file) throw error(404)
    return {
        file_name : params.file_id,
        file_id : params.file_id
    }
}

