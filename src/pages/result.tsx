import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import Image from "next/image";
import { saveCategoryAccuracy, saveReviewQuestions } from "@/lib/firestore"; // 🔥 Firestore 対応

interface QuizResult {
  question: string;
  correctAnswer: string;
  selectedAnswer: string;
  choices: string[];
  category: string;
  image?: { url: string } | null;
}

export default function ResultPage() {
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [hasReviewQuestions, setHasReviewQuestions] = useState<boolean>(false);
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);

  useEffect(() => {
    console.log("🔄 [データ取得] クイズ結果を取得中...");
    if (typeof window !== "undefined") {
      try {
        const results = sessionStorage.getItem("quizResults");
        const storedCategory = sessionStorage.getItem("quizCategory");
        const storedUserId = sessionStorage.getItem("userId");

        if (results) {
          const parsedResults = JSON.parse(results) as QuizResult[];
          setQuizResults(parsedResults);
          console.log("✅ [取得成功] クイズ結果:", parsedResults);

          // **正答数を正しく計算**
          const correctCount = parsedResults.filter(q => q.correctAnswer === q.selectedAnswer).length;
          setFinalScore(correctCount);

          // **間違えた問題を Firestore に保存**
          const incorrectQuestions = parsedResults.filter((q) => q.correctAnswer !== q.selectedAnswer)
          .map(q => ({
            ...q,
            image: q.image ? { url: q.image.url } : null, // 🔥 `image` を明示的にセット
          }));


          if (incorrectQuestions.length > 0) {
            setHasReviewQuestions(true);
            if (storedUserId) {
              console.log("🔥 [Firestore] 間違えた問題を保存:", incorrectQuestions);
              saveReviewQuestions(storedUserId, incorrectQuestions);
            }
          } else {
            setHasReviewQuestions(false);
          }
        }

        if (storedCategory) {
          setCategory(storedCategory);
          console.log("✅ [取得成功] クイズカテゴリー:", storedCategory);
        }

        if (storedUserId) {
          setUserId(storedUserId);
          console.log("✅ [取得成功] ユーザーID:", storedUserId);
        }
      } catch (error) {
        console.error("❌ [エラー] クイズ結果の取得に失敗:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (userId && category && quizResults.length > 0) {
      console.log("🔥 [Firestore] 正答率を保存:", {
        userId,
        category,
        correctAnswers: finalScore,
        totalAttempts: quizResults.length,
      });

      // **正答率の計算を最新の値で行う**
      saveCategoryAccuracy(userId, category, finalScore, quizResults.length)
        .then(() => console.log("✅ [保存成功] Firestore の正答率を更新しました"))
        .catch((err) => console.error("❌ [エラー] Firestore の正答率更新に失敗:", err));
    }
  }, [userId, category, finalScore, quizResults]); // ✅ `finalScore` ではなく `quizResults` を依存リストにする

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-screen py-8 lg:py-16">
        <div className="bg-white p-6 sm:p-8 md:p-12 rounded-lg shadow-xl max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl w-full text-center">
          <h1 className="text-3xl font-bold mb-6">結果発表</h1>
          <p className="text-xl md:text-2xl lg:text-3xl font-semibold mb-3">
            スコア: <span className="text-blue-600">{finalScore}</span> / {quizResults.length}
          </p>

          {quizResults.length > 0 ? (
            <div className="overflow-x-auto max-h-[400px] lg:max-h-[600px] overflow-y-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-300 p-2 text-sm md:text-lg lg:text-xl">問題</th>
                    <th className="border border-gray-300 p-2 text-sm md:text-lg lg:text-xl">正解</th>
                    <th className="border border-gray-300 p-2 text-sm md:text-lg lg:text-xl">あなたの回答</th>
                  </tr>
                </thead>
                <tbody>
                  {quizResults.map((result, index) => (
                    <tr key={index} className="text-center">
                      <td className="border border-gray-300 p-2 text-sm md:text-lg lg:text-xl">{result.question}{result.image && result.image.url && (
          <div className="flex justify-center mt-2">
            <Image src={result.image.url} alt="問題画像" width={100} height={50} className="rounded-lg shadow-md max-w-xs mt-2" />
          </div>
        )}</td>
                      <td className="border border-gray-300 p-2 text-sm md:text-lg lg:text-xl">{result.correctAnswer}</td>
                      <td
                        className={`border border-gray-300 p-2 text-sm md:text-lg lg:text-xl ${
                          result.correctAnswer === result.selectedAnswer ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {result.selectedAnswer}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-red-500 mt-4">クイズの結果が見つかりません。</p>
          )}

          <button
            onClick={() => router.push("/")}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white p-4 mt-6 rounded-lg font-bold text-lg lg:text-xl transition"
          >
            ホームに戻る
          </button>

          {hasReviewQuestions && (
            <div className="mt-4">
              <button
                onClick={() => router.push("/review")}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white p-4 rounded-lg font-bold text-lg lg:text-xl transition"
              >
                間違えた問題を復習する
              </button>
              <p className="mt-2 text-sm md:text-base lg:text-lg text-gray-500">
                ※復習問題は選択形式ではありません。
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
