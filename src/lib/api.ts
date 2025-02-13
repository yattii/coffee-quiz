import axios from "axios";

const MICROCMS_SERVICE_DOMAIN = process.env.NEXT_PUBLIC_MICROCMS_SERVICE_DOMAIN;
const MICROCMS_API_KEY = process.env.NEXT_PUBLIC_MICROCMS_API_KEY;

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

// **クイズを取得**
export const fetchQuizzes = async (category: string): Promise<Quiz[]> => {
  try {
    const res = await axios.get(
      `https://${MICROCMS_SERVICE_DOMAIN}.microcms.io/api/v1/quiz?filters=category[equals]${category}`,
      {
        headers: { "X-MICROCMS-API-KEY": MICROCMS_API_KEY },
      }
    );

    return res.data.contents.map((quiz: any) => ({
      id: quiz.id,
      question: quiz.question,
      choices: [quiz.choices1, quiz.choices2, quiz.choices3, quiz.choices4]
        .filter(choice => choice && choice.trim() !== ""), // **空の選択肢を削除**
      answer: quiz.answer,
      category: quiz.category,
      image: quiz.image ? { url: quiz.image } : null, // **画像がない場合は `null` を返す**
      order: quiz.order || 999, // **表示順を考慮**
    })) as Quiz[];
  } catch (error) {
    console.error("クイズデータの取得に失敗しました:", error);
    return [];
  }
};

// **カテゴリーを取得**
export const fetchCategories = async (): Promise<string[]> => {
  try {
    const res = await axios.get(
      `https://${MICROCMS_SERVICE_DOMAIN}.microcms.io/api/v1/quiz`,
      {
        headers: { "X-MICROCMS-API-KEY": MICROCMS_API_KEY },
      }
    );

    const categories: { name: string; order: number }[] = [
      ...new Map(
        (res.data.contents as Quiz[]).map((quiz) => [quiz.category, { name: quiz.category, order: quiz.order || 999 }])
      ).values(),
    ];

    categories.sort((a, b) => a.order - b.order);
    return categories.map((cat) => cat.name);
  } catch (error) {
    console.error("カテゴリーの取得に失敗しました:", error);
    return [];
  }
};
