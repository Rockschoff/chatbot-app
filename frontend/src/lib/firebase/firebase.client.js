// Import the functions you need from the SDKs you need
import { deleteApp, getApp, getApps, initializeApp } from "firebase/app";
import {  getStorage, ref, uploadBytes, getDownloadURL, listAll } from 'firebase/storage';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getAuth, setPersistence, inMemoryPersistence } from "firebase/auth";
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_APIKEY,
  authDomain: import.meta.env.VITE_AUTHDOMAIN,
  projectId: import.meta.env.VITE_PROJECTID,
  storageBucket: import.meta.env.VITE_STORAGEBUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGINGSENDERID,
  appId: import.meta.env.VITE_APPID
};


// Initialize Firebase


let firebaseApp;
if(!getApps().length){

    firebaseApp=initializeApp(firebaseConfig);

}else{
    firebaseApp=getApp();
    deleteApp(firebaseApp);
    firebaseApp=initializeApp(firebaseConfig);

}

export const auth  = getAuth(firebaseApp);
export const storage = getStorage(firebaseApp);
export const db = getFirestore(firebaseApp);

export {ref, uploadBytes, getDownloadURL, listAll, collection, addDoc, getDocs };