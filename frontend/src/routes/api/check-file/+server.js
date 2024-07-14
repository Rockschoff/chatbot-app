import * as fs from "fs"
import { json } from '@sveltejs/kit'; // Import remains if you need specific helpers

export async function GET(q) {
    console.log("here", q.url.searchParams.get("filename"));
    const filename = q.url.searchParams.get("filename");
    const path = `static/bots-docs/${filename}`;

    try {
        if (fs.existsSync(path)) {
            return new Response(JSON.stringify({ exists: true }), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        } else {
            return new Response(JSON.stringify({ exists: false }), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }
    } catch (err) {
        console.log(err)
        return new Response(JSON.stringify({ error: 'Server error occurred.' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}
