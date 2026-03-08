import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";


// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBnm9yDoIH0jIMih9X61tYKhowbdaUm0q8",
    authDomain: "project-dtm-8dc50.firebaseapp.com",
    projectId: "project-dtm-8dc50",
    databaseURL: "https://project-dtm-8dc50-default-rtdb.asia-southeast1.firebasedatabase.app/",
    storageBucket: "project-dtm-8dc50.firebasestorage.app",
    messagingSenderId: "823622302170",
    appId: "1:823622302170:web:0cb2e15552cbc92bc4e8e3"
  };
  
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); // ใช้สำหรับ Login/Register
export const db = getDatabase(app); // ใช้สำหรับ Todo List
