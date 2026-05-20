// firebase.js
// 1) Create a Firebase project at https://console.firebase.google.com/
// 2) Enable Email/Password auth, Firestore (or Realtime DB) and Storage if you want image uploads
// 3) Copy your app's config object and replace the placeholder values below

// Replace the values in firebaseConfig with your project's config

// firebase.js
import { initializeApp } from "https://gstatic.com";

// Read the config that was loaded by config.js
const config = window.firebaseConfig;

if (!config) {
  console.error("Firebase config is missing! Did you create config.js?");
}

const app = initializeApp(config);
export default app;


if (typeof firebase === 'undefined') {
    console.error('Firebase SDK not loaded. Make sure the script tags are present in index.html');
} else {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log('Firebase initialized');
    }

    // Expose commonly used services on `window` for the existing non-module app
    window.firebaseAuth = firebase.auth();
    window.firestore = firebase.firestore();
    window.firebaseStorage = firebase.storage();

    // Helper examples (return Promises)
    window.signInWithEmail = (email, password) => {
        return window.firebaseAuth.signInWithEmailAndPassword(email, password);
    };

    window.signOut = () => window.firebaseAuth.signOut();

    // Example: add a product doc to Firestore collection 'products'
    window.addProductToFirestore = async (product) => {
        return window.firestore.collection('products').add(product);
    };

    // Example: upload image to Storage and get URL
    window.uploadImageAndGetURL = async (file, path = '') => {
        const storageRef = window.firebaseStorage.ref();
        const fileRef = storageRef.child(`${path}${Date.now()}_${file.name}`);
        await fileRef.put(file);
        return fileRef.getDownloadURL();
    };

    // Upload with progress callback: onProgress receives percent (0-100)
    window.uploadImageWithProgress = (file, path = '', onProgress) => {
        const storageRef = window.firebaseStorage.ref();
        const fileRef = storageRef.child(`${path}${Date.now()}_${file.name}`);
        const uploadTask = fileRef.put(file);
        return new Promise((resolve, reject) => {
            uploadTask.on('state_changed', snapshot => {
                const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                if (typeof onProgress === 'function') onProgress(percent);
            }, err => reject(err), async () => {
                try {
                    const url = await fileRef.getDownloadURL();
                    resolve(url);
                } catch (e) { reject(e); }
            });
        });
    };
}
