import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBBtJVS8WY9biPHGhMQtqsUooumFkztiAA",
  authDomain: "western-mona-taxis.firebaseapp.com",
  projectId: "western-mona-taxis",
  storageBucket: "western-mona-taxis.firebasestorage.app",
  messagingSenderId: "846535498567",
  appId: "1:846535498567:web:a1127a03253d8240890a62"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };