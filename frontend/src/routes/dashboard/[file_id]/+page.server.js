import {error} from "@sveltejs/kit"
import {data} from "../../../lib/data"
import { OpenAI} from 'openai';

const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_APIKEY,
    dangerouslyAllowBrowser: true
});

export async function load({params}){
    let file;
    console.log(params)
    try{
        file =  await openai.files.retrieve(params.file_id); //data.find((d)=>d.file_id===params.file_id)
    }catch(e){
        console.log("Error getting filename from openai")
        throw error(404)
    }
    console.log("found the file" , file)
    if (!file) throw error(404)
    return {
        file_name : file.filename,
        file_id : params.file_id
    }
}

