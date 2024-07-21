import { writable } from "svelte/store";

export const userStore = writable({
    _id:"",
    user_id : "",
    user_nmae : "",
    isPremium : "",
    premium_end_date:"",
    premium_start_date:""
})