import { writable } from "svelte/store";
import {auth} from "../lib/firebase/firebase.client"
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, updateEmail, updatePassword, updateProfile, type User } from "firebase/auth";

export const authStore = writable({
    isLoading : true,
    currentUser : null
})

export const authHandlers = {

    login : async (email:string , password:string)=>{
        await signInWithEmailAndPassword(auth , email , password)
    },
    
    signup : async (email:string  ,password:string , fname:string , lname:string)=>{
        await createUserWithEmailAndPassword(auth , email , password).then(
            (userCredential)=>{
                const user = userCredential.user;
                updateProfile(user,{
                    displayName:firstName+" "+lastName
                }).then(()=>{console.log("profile was updated with the name")})
                .catch((err)=>{console.error("error updated the profile" , err)})
            }
        )
    },


    logout : async ()=>{
        await signOut(auth);
    },

    resetPassword : async(email:string)=>{
        await sendPasswordResetEmail(auth , email)
    },

    updateEmail : async (email:string)=>{
        await updateEmail(auth , email)
    },

    updatePassword : async (password:string)=>{
        await updatePassword(auth , password)
    },

    updateName : async (user : User , name : string)=>{
        await updateProfile(user , {displayName : name}).then(()=>{
            console.log("name has been updated")
        })
    }   


}
