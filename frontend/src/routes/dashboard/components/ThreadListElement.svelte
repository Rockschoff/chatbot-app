<script lang="ts">
    import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
    import {afterUpdate, createEventDispatcher, onMount} from "svelte";
    import {faTimes } from '@fortawesome/free-solid-svg-icons';
    const dispatch = createEventDispatcher()

    export let thread : {thread_id : string ; thread_name : string};
    export let index : number;

    let name = thread.thread_name;
    let date = ""

    if(thread.thread_name.includes("%")){
        [name , date] = thread.thread_name.split('%')
    }

    
    

</script>


<div
    class="w-full flex items-center p-3 bg-gray-700 mb-2 rounded-md shadow hover:bg-gray-600 cursor-pointer transition duration-200"
>
    <p
        class="text-gray-300 text-sm hover:underline flex-grow"
        on:click={() => {
            dispatch("loadMessages" , {thread_id : thread.thread_id ,thread_name : thread.thread_name})
        }}
    >
        {index + 1}. {name}
        {#if date}
            <span class="text-xs text-gray-400 ml-2">{date}</span>
        {/if}
    </p>
    <button
        class="text-red-500 hover:text-red-600 transition duration-200"
        on:click={() => {dispatch("deleteThread" ,  {thread_id : thread.thread_id ,thread_name : thread.thread_name})}}
        title="Delete Thread"
        id="delete-thread"
    >
        <FontAwesomeIcon icon={faTimes} />
    </button>
</div>