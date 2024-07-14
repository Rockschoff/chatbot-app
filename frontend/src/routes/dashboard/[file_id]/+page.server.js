import {error} from "@sveltejs/kit"
import {data} from "../../../lib/data"

export function load({params}){
    console.log(params)
    const file = data.find((d)=>d.file_id===params.file_id)
    console.log("found the file" , file)
    if (!file) throw error(404)
    return {
        file_name : file.file_name,
        file_id : file.file_id
    }
}

