import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// ✅ Firebase の設定
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// ✅ Firebase アプリの初期化
const app = initializeApp(firebaseConfig);

// ✅ Firestore のインスタンスをエクスポート
const db = getFirestore(app);


export { db }; // 🔥 `db` を明示的にエクスポート
