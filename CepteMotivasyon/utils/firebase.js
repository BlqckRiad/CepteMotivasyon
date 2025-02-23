import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Firebase yapılandırması
const firebaseConfig = {
  apiKey: "AIzaSyD5bZQFynZ5-HZRrhP_sEK_4jBsl2nm9aw",
  authDomain: "ceptemotivasyon-8a892.firebaseapp.com",
  databaseURL: "https://ceptemotivasyon-8a892-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "ceptemotivasyon-8a892",
  storageBucket: "ceptemotivasyon-8a892.firebasestorage.app",
  messagingSenderId: "669614003189",
  appId: "1:669614003189:web:868afa11b043eed7c886bc",
  measurementId: "G-ZQZJ60F4ER"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

// Firestore'u özel ayarlarla başlat
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
  cacheSizeBytes: 50000000 // 50MB cache
});


try {
  const analytics = getAnalytics(app);
} catch (error) {
  console.log('Analytics is not available in this environment');
}

export { db }; 