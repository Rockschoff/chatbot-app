import {OpenAI} from "openai"
import {tools , botDescription} from "./openAITool"

const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_APIKEY,
    dangerouslyAllowBrowser: true
});


export default async function getResponse(thread :  OpenAI.ChatCompletionMessageParam[]) : Promise<string> {
    try{
        const reponse : OpenAI.ChatCompletion = await openai.chat.completions.create({
            model : "gpt-4o-2024-08-06",
            messages : [{role : "system" , content : botDescription} , ...thread],
            tools: tools,
            tool_choice:"auto"
        })
        return reponse.choices[0].message.content ? reponse.choices[0].message.content : await getReponseFromFunctionCall(reponse.choices[0].message , thread)
    }catch(err){
        console.error('Error occured in reaching openai', err)
        return "Error Occured in reaching openai"
    }
}

async function getReponseFromFunctionCall(message : OpenAI.Chat.Completions.ChatCompletionMessage , thread :  OpenAI.ChatCompletionMessageParam[]) : Promise<string>{
    if (message.tool_calls){
        console.log(message.tool_calls)

        let apis : {content : Promise<string> , tool_call_id : string , role : string}[] = []
        message.tool_calls.map((call : any)=>{
            let terms = JSON.parse(call.function.arguments)
            let text = Search_CFR_Title_21(terms.search_terms)
            apis = [...apis , {content : text , tool_call_id:call.id , role:"tool"}]
        })
        
        let res :  OpenAI.Chat.Completions.ChatCompletionMessage[] = await Promise.all(apis.map(async (ele)=>{
            return {
                content : await ele.content,
                role : ele.role,
                tool_call_id :ele.tool_call_id,
            }
        }))
        
        // const terms = JSON.parse(message.tool_calls[0].function.arguments)
        
        // const relevantThings  = await Search_CFR_Title_21(terms.search_terms)

        // const toolMessage : OpenAI.Chat.Completions.ChatCompletionMessage = {role : "tool" , content : relevantThings, tool_call_id:message.tool_calls[0].id }

        console.log("Making the call to openai second time")

        try{
            const reponse : OpenAI.ChatCompletion = await openai.chat.completions.create({
                model : "gpt-4o-2024-08-06",
                messages : [{role : "system" , content : botDescription} , ...thread , message , ...res]
            })

            return reponse.choices[0].message.content? reponse.choices[0].message.content:"--"
        }catch(err){
            console.log("Error occures in the second call to OpenAI" , err)
            return ""
        }
    }
    return "Error running th tool on openAI"
}

export async function GetToolResponse(tools_calls : any[]){
    const promiseContent = tools_calls.map((ele)=>{
        const terms = JSON.parse(ele.function.arguments)
        const text = Search_CFR_Title_21(terms.search_terms)
        return {tool_call_id : ele.id , role : "tool" , content: text}
    })

    const content = await Promise.all(promiseContent.map(async (ele)=>{
        return {
            tool_call_id : ele.tool_call_id,
            // role : ele.role,
            output : await ele.content
        }
    }))

    return content
}


async function Search_CFR_Title_21(search_terms:string):Promise<string>{
    // const url = "https://www.ecfr.gov/api/search/v1/results?query=eggs%20and%20milk%20and%20lactic%20acid&per_page=5&page=1&order=relevance&paginate_by=results";
    // const url = "/api/api/search/v1/results?query=eggs%20and%20milk%20and%20lactic%20acid&per_page=25&page=1&order=relevance&paginate_by=results";
    const encodedSearchTerms = encodeURIComponent(search_terms);
    const url = `/api/api/search/v1/results?query=${encodedSearchTerms}&per_page=25&page=1&order=relevance&paginate_by=results`;
    const options = {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        },
    };
    console.log("Searching CFR" , search_terms)
    const ans : string = await fetch(url, options)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(async (data) => {
            console.log(data);
            const c = data.results.map((ele : any)=>ele.hierarchy)
            const hierarchyText : string[] = data.results.map((ele : any)=>ele.full_text_excerpt + JSON.stringify(ele.hierarchy_headings))//await getTextFromCFR(c);
            console.log(hierarchyText.map((ele)=>ele.length))
            return hierarchyText.join("\n")
            
        })
        .catch(error => {
            console.error('There was an error with the fetch operation:', error);
            return "Error Geting reponse from CFR"
        });
    return ans
}

async function getTextFromCFR(c : any): Promise<string[]>{

    console.log("Getting text from CFR ," )
    let promiseArray: Promise<any>[] = [];
    c.map((ele : any)=>{
        let f = callAPI(ele)
        promiseArray.push(f);
    })
    let results = await Promise.all(promiseArray)
    for(var i = 0 ; i < results.length ; i++){
        results[i] = JSON.stringify(c[i]) + 'Text : ' + results[i] + "\n\n" 
    }
    return results
}

async function callAPI(params:any):Promise<string>{
    console.log(params)
    params.date = "2024-01-01"
    // const baseUrl = `https://www.ecfr.gov/api/title/${params.date}/title-${params.title}/source`;
    const baseUrl = `/api/api/versioner/v1/full/${params.date}/title-${params.title}.xml`;
    const queryParams = new URLSearchParams();
    if (params.subtitle) queryParams.append('subtitle', params.subtitle);
    if (params.chapter) queryParams.append('chapter', params.chapter);
    if (params.subchapter) queryParams.append('subchapter', params.subchapter);
    if (params.part) queryParams.append('part', params.part);
    if (params.subpart) queryParams.append('subpart', params.subpart);
    if (params.section) queryParams.append('section', params.section);
    if (params.appendix) queryParams.append('appendix', params.appendix);
    const url = `${baseUrl}?${queryParams.toString()}`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/xml'
            },
        });

        if (!response.ok) {
            throw new Error(`Error fetching data: ${response.status} - ${response.statusText}`);
        }

        // Since the content-type is application/xml, we'll treat it as text
        console.log("Got this text for :" , params.title)
        return await response.text();
        
    } catch (error) {
        console.error('Error occurred while fetching the eCFR Title Source XML:', error);
        throw error;
    }
    return ""
}

const funcs = {
    "Search_CFR_Title_21" : Search_CFR_Title_21
}

function getCurrentDateTime() {
    const now = new Date();
    const date = now.toLocaleDateString('en-US');
    const time = now.toLocaleTimeString('en-US');
    return `${date} ${time}`;
}

export async function getThreadName(text : string): Promise<string> {
    const systemMessage = `You are a thread name generator, the user will give a text that is the first message of the thread using that text generate a 
    3-5 word long  name for the thread. Return only the name and nothing else. Example , user : 'what is significance of FSVP in Japan'; assistant : 'About FSVP in Japan'`
    try{
        const reponse : OpenAI.ChatCompletion = await openai.chat.completions.create({
            model : "gpt-4o-2024-08-06",
            messages : [{role : "system" , content : systemMessage},
            {role : "user" , content : text}]
        })
        return reponse.choices[0].message.content?reponse.choices[0].message.content+"%"+getCurrentDateTime():text.substring(0,15)+"..."
    }catch(err){

        console.error("Error genrating the name of the thread" , err)
        return text.substring(0,15)+"..."

    }
    return ""
}

