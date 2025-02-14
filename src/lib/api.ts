import axios from "axios";

// ✅ `MICROCMS_API_KEY_QUIZ` を使用
const MICROCMS_SERVICE_DOMAIN = process.env.NEXT_PUBLIC_MICROCMS_SERVICE_DOMAIN;
const MICROCMS_API_KEY_QUIZ = process.env.NEXT_PUBLIC_MICROCMS_API_KEY_QUIZ;

// **MicroCMS のレスポンス型**
interface MicroCMSQuiz {
  id: string;
  question: string;
  choices1?: string;
  choices2?: string;
  choices3?: string;
  choices4?: string;
  answer: string;
  category: string;
  image?: { url: string };
  order?: number;
}

// **クイズの型定義**
export interface Quiz {
  id: string;
  question: string;
  choices: string[];
  answer: string;
  category: string;
  image?: { url: string } | null;
  order?: number;
}

// ✅ **環境変数のデバッグ**
console.log("✅ 環境変数のチェック:");
console.log("📌 MICROCMS_SERVICE_DOMAIN:", MICROCMS_SERVICE_DOMAIN || "⚠ 環境変数が設定されていません");
console.log("📌 MICROCMS_API_KEY_QUIZ:", MICROCMS_API_KEY_QUIZ ? "✅ 設定済み" : "⚠ 環境変数が設定されていません");

// **クイズを取得**
export const fetchQuizzes = async (category: string): Promise<Quiz[]> => {
  try {
    console.log("✅ クイズ取得開始 - カテゴリー:", category);
    
    const apiUrl = `https://${MICROCMS_SERVICE_DOMAIN}.microcms.io/api/v1/quiz?filters=category[equals]${category}`;
    console.log("📌 API URL:", apiUrl);
    
    const res = await axios.get<{ contents: MicroCMSQuiz[] }>(apiUrl, {
      headers: { "X-MICROCMS-API-KEY": MICROCMS_API_KEY_QUIZ },
    });

    console.log("✅ APIレスポンス:", res.data);

    return res.data.contents.map((quiz) => {
      const choices = [quiz.choices1, quiz.choices2, quiz.choices3, quiz.choices4]
        .filter((choice): choice is string => !!choice && choice.trim() !== ""); // ✅ `choice is string` を追加

      console.log("✅ クイズデータ:", {
        id: quiz.id,
        question: quiz.question,
        choices, // ✅ 選択肢が正しくセットされているか確認
        answer: quiz.answer,
        category: quiz.category,
        image: quiz.image ? { url: quiz.image.url } : null, // ✅ `quiz.image.url` に修正
        order: quiz.order ?? 999,
      });

      return {
        id: quiz.id,
        question: quiz.question,
        choices,
        answer: quiz.answer,
        category: quiz.category,
        image: quiz.image ? { url: quiz.image.url } : null,
        order: quiz.order ?? 999,
      };
    });
  } catch (error) {
    console.error("❌ クイズデータの取得に失敗:", error);
    return [];
  }
};

// **カテゴリーを取得**
export const fetchCategories = async (): Promise<string[]> => {
  try {
    console.log("✅ カテゴリー取得開始");

    const apiUrl = `https://${MICROCMS_SERVICE_DOMAIN}.microcms.io/api/v1/quiz`;
    console.log("📌 API URL:", apiUrl);

    const res = await axios.get<{ contents: MicroCMSQuiz[] }>(apiUrl, {
      headers: { "X-MICROCMS-API-KEY": MICROCMS_API_KEY_QUIZ },
    });

    console.log("✅ カテゴリー API レスポンス:", res.data.contents);

    // ✅ `category` の重複を削除し、並び替え
    const categories = [
      ...new Map(
        res.data.contents.map((quiz) => [
          quiz.category,
          { name: quiz.category, order: quiz.order ?? 999 },
        ])
      ).values(),
    ];

    categories.sort((a, b) => a.order - b.order);
    
    console.log("✅ 取得したカテゴリー:", categories.map((cat) => cat.name));
    return categories.map((cat) => cat.name);
  } catch (error) {
    console.error("❌ カテゴリーの取得に失敗:", error);
    return [];
  }
};
