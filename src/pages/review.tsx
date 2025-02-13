import { useEffect, useState } from "react";
import { useRouter } from "next/router";

// **復習用問題データの型**
interface ReviewQuestion {
  question: string;
  correctAnswer: string;
}

// **カウントダウンの秒数**
const COUNTDOWN_TIME = 5;
const SHOW_ANSWER_TIME = 2;
const START_COUNTDOWN = 3; // ✅ **カウントダウン開始時間**

export default function ReviewPage() {
  const [reviewQuestions, setReviewQuestions] = useState<ReviewQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [feedback, setFeedback] = useState<"showCorrect" | null>(null);
  const [countdown, setCountdown] = useState(START_COUNTDOWN);
  const [quizStarted, setQuizStarted] = useState(false);
  const [showStartText, setShowStartText] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedReviewQuestions = sessionStorage.getItem("reviewQuestions");

      if (storedReviewQuestions) {
        try {
          const parsedQuestions = JSON.parse(storedReviewQuestions) as ReviewQuestion[];

          if (parsedQuestions.length === 0) {
            console.warn("⚠️ 復習データが空です。");
            router.push("/result");
          } else {
            console.log("✅ 復習データを読み込み:", parsedQuestions);
            setReviewQuestions(parsedQuestions);
          }
        } catch (error) {
          console.error("❌ 復習データの解析に失敗しました:", error);
          router.push("/result");
        }
      } else {
        console.warn("⚠️ 復習データが見つかりません。");
        router.push("/result");
      }
    }
  }, []);

  // ✅ **復習開始前のカウントダウン処理**
  useEffect(() => {
    const countdownTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(countdownTimer);
          setShowStartText(true);
          setTimeout(() => {
            setQuizStarted(true);
            setShowStartText(false);
          }, 1000);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownTimer);
  }, []);

  useEffect(() => {
    if (!quizStarted || reviewQuestions.length === 0 || currentQuestionIndex >= reviewQuestions.length) return;

    let countdownValue = COUNTDOWN_TIME;
    setCountdown(countdownValue);

    const countdownTimer = setInterval(() => {
      countdownValue -= 1;
      setCountdown(countdownValue);

      if (countdownValue <= 0) {
        clearInterval(countdownTimer);
        setFeedback("showCorrect");
      }
    }, 1000);

    return () => clearInterval(countdownTimer);
  }, [currentQuestionIndex, reviewQuestions, quizStarted]);

  const handleNextQuestion = () => {
    setFeedback(null);

    if (currentQuestionIndex + 1 < reviewQuestions.length) {
      console.log(`🔄 次の問題へ: ${currentQuestionIndex + 1}`);
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      console.log("✅ 復習問題がすべて完了しました。");
      sessionStorage.removeItem("reviewQuestions");
      router.push("/result");
    }
  };

  if (!quizStarted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f5e6ca] text-orange-500">
        <div className="text-center text-6xl md:text-9xl lg:text-10xl font-bold animate-fadeIn">
          {showStartText ? "🎯 スタート！" : ` ${countdown}`}
        </div>

        {/* フェードインアニメーション */}
        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: scale(0.8);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          .animate-fadeIn {
            animation: fadeIn 0.8s ease-in-out;
          }
        `}</style>
      </div>
    );
  }

  if (reviewQuestions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f5e6ca] text-gray-900 px-4 text-2xl font-bold text-center">
        🚫 復習できる問題がありません。
      </div>
    );
  }

  const question = reviewQuestions[currentQuestionIndex];

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-[#f5e6ca] text-gray-900 px-4 pt-12 relative">
      {/* タイマーエリア */}
      <div className="w-full max-w-4xl flex justify-center mb-6">
        <div className="text-3xl md:text-4xl font-bold bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg">
           {countdown} 秒
        </div>
      </div>

      {/* 問題エリア */}
      <div className="relative bg-white p-8 sm:p-10 md:p-16 rounded-lg shadow-xl w-full max-w-4xl text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">{question?.question}</h2>
      </div>

      {/* ✅ **正解を画面中央に表示するカード** */}
      {feedback === "showCorrect" && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-8 sm:p-10 md:p-12 rounded-lg shadow-2xl text-center w-full max-w-md">
            <span className="text-3xl md:text-4xl font-bold text-green-500"> 正解</span>
            <p className="text-3xl md:text-5xl font-bold mt-6">{question.correctAnswer}</p>

            {/* ✅ 「次の問題へ」ボタン */}
            <button
              onClick={handleNextQuestion}
              className="w-full bg-green-500 hover:bg-green-600 text-white p-3 md:p-4 rounded-lg font-bold text-lg md:text-xl transition mt-8"
            >
              {currentQuestionIndex + 1 < reviewQuestions.length ? "次の問題へ ▶" : "結果発表へ ▶"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
