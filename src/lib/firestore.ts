import { db } from "../lib/firebase";
import { doc, setDoc, getDoc, collection, getDocs, writeBatch } from "firebase/firestore";

interface User {
  userId: string;
  nickname: string;
  lastLogin?: string;
}

interface AccuracyData {
  [category: string]: { totalAttempts: number; correctAnswers: number };
}

interface QuizResult {
  question: string;
  correctAnswer: string;
  selectedAnswer: string;
  choices: string[];
}

// ✅ Firestore にユーザー情報を保存
export async function saveUser(userId: string, nickname: string) {
  try {
    await setDoc(doc(db, "users", userId), { userId, nickname }, { merge: true });
    console.log("✅ ユーザー情報を保存:", { userId, nickname });
  } catch (error) {
    console.error(`❌ ユーザー ${userId} の保存に失敗:`, error);
  }
}

// ✅ Firestore からユーザー情報を取得
export async function getUser(userId: string): Promise<User | null> {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    return userDoc.exists() ? (userDoc.data() as User) : null;
  } catch (error) {
    console.error(`❌ ユーザー ${userId} の取得に失敗:`, error);
    return null;
  }
}

// ✅ Firestore にログイン履歴を保存
export async function updateLastLogin(userId: string) {
  try {
    const now = new Date().toISOString();
    await setDoc(doc(db, "users", userId), { lastLogin: now }, { merge: true });
    console.log(`✅ ユーザー ${userId} の最終ログインを更新: ${now}`);
  } catch (error) {
    console.error(`❌ ユーザー ${userId} の最終ログイン更新に失敗:`, error);
  }
}

// ✅ Firestore からカテゴリーを取得
export async function fetchCategories(): Promise<string[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "categories"));
    return querySnapshot.docs.map((doc) => doc.id);
  } catch (error) {
    console.error("❌ カテゴリーの取得に失敗:", error);
    return [];
  }
}

// ✅ Firestore から正答率データを取得
export async function fetchCategoryAccuracy(userId: string): Promise<AccuracyData> {
  try {
    const userDoc = await getDoc(doc(db, "user_accuracy", userId));
    return userDoc.exists() ? (userDoc.data() as AccuracyData) : {};
  } catch (error) {
    console.error(`❌ ユーザー ${userId} の正答率データ取得に失敗:`, error);
    return {};
  }
}

// ✅ Firestore に正答率データを保存（更新）
export async function saveCategoryAccuracy(userId: string, category: string, correct: number, total: number) {
  try {
    const userRef = doc(db, "user_accuracy", userId);
    const userDoc = await getDoc(userRef);

    let accuracyData: AccuracyData = userDoc.exists() ? (userDoc.data() as AccuracyData) : {};
    accuracyData[category] = { totalAttempts: total, correctAnswers: correct };

    await setDoc(userRef, accuracyData, { merge: true });
    console.log(`✅ ユーザー ${userId} の正答率を更新:`, accuracyData);
  } catch (error) {
    console.error(`❌ ユーザー ${userId} の正答率更新に失敗:`, error);
  }
}

// ✅ Firestore からランキングデータを取得
export async function fetchRankings(): Promise<{ nickname: string; clearCount: number }[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "user_accuracy"));
    const rankings: { userId: string; clearCount: number }[] = [];

    // 各ユーザーのクリア数を計算
    querySnapshot.forEach((doc) => {
      const userId = doc.id;
      const accuracyData = doc.data() as AccuracyData;
      const clearCount = Object.values(accuracyData).filter(
        (data) => data.correctAnswers === data.totalAttempts && data.totalAttempts > 0
      ).length;

      rankings.push({ userId, clearCount });
    });

    // `users` コレクションからニックネームを一括取得
    const userDocs = await getDocs(collection(db, "users"));
    const userMap = new Map(userDocs.docs.map((doc) => [doc.id, doc.data().nickname]));

    // ニックネームを付与
    const finalRankings = rankings
      .map(({ userId, clearCount }) => ({
        nickname: userMap.get(userId) || "Unknown",
        clearCount,
      }))
      .sort((a, b) => b.clearCount - a.clearCount);

    return finalRankings;
  } catch (error) {
    console.error("❌ ランキングの取得に失敗:", error);
    return [];
  }
}

// ✅ Firestore にクイズ結果を保存
export async function saveQuizResult(userId: string, category: string, results: QuizResult[]) {
  try {
    await setDoc(doc(db, "quizResults", userId), { [category]: results }, { merge: true });
    console.log(`✅ ユーザー ${userId} のクイズ結果を Firestore に保存:`, results);
  } catch (error) {
    console.error(`❌ ユーザー ${userId} のクイズ結果保存に失敗:`, error);
  }
}

// ✅ Firestore からクイズ結果を取得
export async function fetchQuizResult(userId: string, category: string): Promise<QuizResult[]> {
  try {
    const userDoc = await getDoc(doc(db, "quizResults", userId));
    return userDoc.exists() ? (userDoc.data()[category] || []) as QuizResult[] : [];
  } catch (error) {
    console.error(`❌ ユーザー ${userId} のクイズ結果取得に失敗:`, error);
    return [];
  }
}

// ✅ Firestore に間違えた問題を保存
export async function saveReviewQuestions(userId: string, reviewQuestions: QuizResult[]) {
  try {
    await setDoc(doc(db, "reviewQuestions", userId), { questions: reviewQuestions }, { merge: true });
    console.log(`✅ ユーザー ${userId} の間違えた問題を Firestore に保存:`, reviewQuestions);
  } catch (error) {
    console.error(`❌ ユーザー ${userId} の間違えた問題保存に失敗:`, error);
  }
}

// ✅ Firestore から間違えた問題を取得
export async function fetchReviewQuestions(userId: string): Promise<QuizResult[]> {
  try {
    const userDoc = await getDoc(doc(db, "reviewQuestions", userId));
    return userDoc.exists() ? (userDoc.data().questions || []) as QuizResult[] : [];
  } catch (error) {
    console.error(`❌ ユーザー ${userId} の間違えた問題取得に失敗:`, error);
    return [];
  }
}
