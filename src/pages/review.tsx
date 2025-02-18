import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { motion } from "framer-motion";
import { fetchReviewQuestions } from "@/lib/firestore"; // 🔥 Firestore の関数をインポート

// **復習用問題データの型**
interface QuizResult {
  question: string;
  correctAnswer: string;
  image?: { url: string } | null;
}

// **カウントダウンの秒数**
const COUNTDOWN_TIME = 5;
const START_COUNTDOWN = 3; // ✅ **カウントダウン開始時間**

export default function ReviewPage() {
  const [reviewQuestions, setReviewQuestions] = useState<QuizResult[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [feedback, setFeedback] = useState<"showCorrect" | null>(null);
  const [countdown, setCountdown] = useState(START_COUNTDOWN);
  const [quizStarted, setQuizStarted] = useState(false);
  const [showStartText, setShowStartText] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  // ✅ Firestore から間違えた問題を取得（useCallback を使用）
const loadReviewQuestions = useCallback(async (userId: string) => {
  try {
    const questions = await fetchReviewQuestions(userId);
    if (questions.length === 0) {
      console.warn("⚠️ Firestore からの復習データが空です。");
      router.push("/result");
    } else {
      console.log("✅ 復習データを読み込み:", questions);
      setReviewQuestions(questions);
    }
  } catch (error) {
    console.error("❌ Firestore からの復習データ取得に失敗:", error);
    router.push("/result");
  }
}, [router]);

// ✅ useEffect で loadReviewQuestions を依存配列に追加
useEffect(() => {
  if (typeof window !== "undefined") {
    const storedUserId = sessionStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
      loadReviewQuestions(storedUserId);
    } else {
      console.warn("⚠️ ユーザーIDが見つかりません。");
      router.push("/result");
    }
  }
}, [router, loadReviewQuestions]); // ✅ loadReviewQuestions を依存配列に追加


  useEffect(() => {
    if (userId) {
      loadReviewQuestions(userId);
    }
  }, [userId, loadReviewQuestions, router]);

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
      router.push("/result");
    }
  };

  if (!quizStarted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f5e6ca] text-orange-500">
        <div className="text-center text-6xl md:text-9xl lg:text-10xl font-bold animate-fadeIn">
          {showStartText ? " スタート！" : ` ${countdown}`}
        </div>

        
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
      {/* ✅ カウントダウンバー */}
      <Timer timeLeft={countdown} currentQuestionIndex={currentQuestionIndex} />

      {/* 問題エリア */}
      <div className="relative bg-white p-8 sm:p-10 md:p-16 rounded-lg shadow-xl w-full max-w-4xl text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">{question?.question}</h2>
        {/* 🔥 画像がある場合は表示 */}
  {question.image && question.image.url && (
    <div className="flex justify-center mt-6">
      <Image src={question.image.url} alt="問題画像" width={400} height={250} className="rounded-lg shadow-md" />
    </div>
  )}
      </div>

      {/* ✅ **正解を画面中央に表示するカード** */}
      {feedback === "showCorrect" && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white mx-8 p-8 sm:p-10 md:p-12 rounded-lg shadow-2xl text-center w-full max-w-md">
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

const Timer = ({ timeLeft, currentQuestionIndex }: { timeLeft: number; currentQuestionIndex: number }) => {
  return (
    <div className="fixed top-4 right-4 z-50 w-64">
      <div className="relative bg-gray-300 h-6 rounded-lg overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 text-gray-700 flex items-center justify-center text-lg font-bold z-10 mix-blend-difference">
          {timeLeft} 秒
        </div>
        <motion.div
          key={currentQuestionIndex}
          className="absolute top-0 right-0 h-full"
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: 5, ease: "linear" }}
          style={{ backgroundColor: timeLeft <= 2 ? "red" : "orange" }}
        />
      </div>
    </div>
  );
};