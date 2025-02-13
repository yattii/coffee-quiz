import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";

interface QuizResult {
  question: string;
  correctAnswer: string;
  selectedAnswer: string;
  choices: string[]; // **選択肢を保持**
  category: string;
}

export default function ResultPage() {
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [hasReviewQuestions, setHasReviewQuestions] = useState<boolean>(false);
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const results = sessionStorage.getItem("quizResults");
      const score = sessionStorage.getItem("finalScore");
      const storedCategory = sessionStorage.getItem("quizCategory");
      const storedUserId = sessionStorage.getItem("userId");

      if (results) {
        try {
          const parsedResults = JSON.parse(results) as QuizResult[];
          setQuizResults(parsedResults);

          // **復習用データを保存**
          const incorrectQuestions = parsedResults
            .filter((q) => q.correctAnswer !== q.selectedAnswer)
            .map((q) => ({
              ...q,
              choices: q.choices,
            }));

          if (incorrectQuestions.length > 0) {
            sessionStorage.setItem("reviewQuestions", JSON.stringify(incorrectQuestions));
            setHasReviewQuestions(true);
          } else {
            sessionStorage.removeItem("reviewQuestions");
            setHasReviewQuestions(false);
          }
        } catch (error) {
          console.error("クイズ結果の解析に失敗しました:", error);
        }
      }

      if (score) {
        try {
          setFinalScore(JSON.parse(score) as number);
        } catch (error) {
          console.error("スコアの解析に失敗しました:", error);
        }
      }

      if (storedCategory) setCategory(storedCategory);
      if (storedUserId) setUserId(storedUserId);
    }
  }, []);

  useEffect(() => {
    if (userId && category) {
      updateAccuracy(userId, category, finalScore, quizResults.length);
    }
  }, [userId, category, finalScore, quizResults.length]);

  // ✅ **正答率を更新**
  const updateAccuracy = (userId: string, category: string, correct: number, total: number) => {
    if (typeof window === "undefined") return;
    const key = `accuracy_${userId}`;
    const storedData = JSON.parse(localStorage.getItem(key) || "{}");

    storedData[category] = {
      totalAttempts: total,
      correctAnswers: correct,
    };

    localStorage.setItem(key, JSON.stringify(storedData));
    window.dispatchEvent(new Event("storage"));
  };

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
                      <td className="border border-gray-300 p-2 text-sm md:text-lg lg:text-xl">{result.question}</td>
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
