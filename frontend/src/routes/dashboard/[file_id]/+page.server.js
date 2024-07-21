import {error} from "@sveltejs/kit"
import {data} from "../../../lib/data"

export async function load({params}){
    let file;
    console.log(params)
    const file = data.find((d)=>d.file_id===params.file_id)
    console.log("found the file" , file)
    if (!file) throw error(404)
    return {
        file_name : file.filename,
        file_id : params.file_id
    }
}

