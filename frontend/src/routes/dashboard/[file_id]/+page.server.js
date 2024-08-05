import {error} from "@sveltejs/kit"


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
        file_name : "files/"+ params.file_id,
        file_id : "files/"+ params.file_id
    }
}

