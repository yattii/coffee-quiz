import { GetServerSideProps } from "next";
import { useState, useEffect, useCallback, useRef  } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { fetchQuizzes } from "../lib/api";
import { saveQuizResult, saveReviewQuestions } from "../lib/firestore"; // Firestore 連携
import { motion } from "framer-motion";

const TOTAL_TIME = 12; // クイズの制限時間

const Timer = ({ timeLeft, currentQuestionIndex }: { timeLeft: number; currentQuestionIndex: number }) => {
  return (
    <div className="fixed top-4 right-4 z-50 w-64 opacity-85">
      {/* タイムバー */}
      <div className="relative bg-gray-300 h-6 rounded-lg overflow-hidden flex items-center justify-center">
        {/* 残り時間のテキスト */}
        <div
          className="absolute inset-0 flex items-center justify-center text-lg font-bold"
          style={{
            color: timeLeft <= 3 ? "red" : "gray", // 残り3秒で赤、それ以外は黒
            zIndex: 10,
          }}
        >
          {timeLeft} 秒
        </div>

        {/* アニメーションするタイムバー */}
        <motion.div
          key={currentQuestionIndex} // 🔥 問題が変わるたびにリセット
          className="absolute top-0 right-0 h-full"
          initial={{ width: "100%" }} // 🔥 初期値 100%
          animate={{ width: "0%" }} // 🔥 0% まで減少
          transition={{ duration: 12, ease: "linear" }}
          style={{
            backgroundColor: timeLeft <= 3 ? "red" : "orange",
          }}
        />
      </div>
    </div>
  );
};



const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

interface Quiz {
  id: string;
  question: string;
  choices: string[];
  answer: string;
  image?: { url: string } | null;
  category: string;
}

interface QuizResult {
  question: string;
  correctAnswer: string;
  selectedAnswer: string;
  choices: string[];
  image?: { url: string } | null;
}

interface QuizProps {
  quizzes: Quiz[];
}

const QuizPage: React.FC<QuizProps> = ({ quizzes = [] }) => {
  const [shuffledQuizzes, setShuffledQuizzes] = useState<Quiz[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState<QuizResult[]>([]);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [countdown, setCountdown] = useState(3);
  const [quizStarted, setQuizStarted] = useState(false);
  const [showStartText, setShowStartText] = useState(false);
  const router = useRouter();
  const category = router.query.category as string;
  const userId = typeof window !== "undefined" ? sessionStorage.getItem("userId") : null;

  const isTimeoutTriggered = useRef(false); // ✅ タイムアウトが連続発火しないように制御


  useEffect(() => {
    if (!quizzes || quizzes.length === 0) return;
  
    console.log("✅ [デバッグ] fetchQuizzes から取得したデータ:", quizzes); // 🔍 `image` があるか確認
  
    const shuffled = shuffleArray(quizzes).map((q) => ({
      ...q,
      choices: shuffleArray(q.choices),
      image: q.image ? { url: q.image.url } : null, // 🔥 `image` を明示的にセット
    }));
  
    console.log("✅ [デバッグ] shuffledQuizzes にセットするデータ:", shuffled); // 🔍 `image` があるか確認
    setShuffledQuizzes(shuffled);
  }, [quizzes]);
  
  useEffect(() => {
    if (!quizStarted) return;
    setTimeLeft(12);
  }, [currentQuestionIndex, quizStarted]);

  // ✅ クイズ終了時のデータ保存関数
  const handleQuizEnd = useCallback(async (updatedAnswers: QuizResult[]) => {
    if (userId) {
      console.log("🔥 [Firestore] クイズ結果を保存:", updatedAnswers);
    
      // `image` を `{ url: string } | null` に統一して保存
      const formattedAnswers = updatedAnswers.map(q => ({
        ...q,
        image: q.image ? { url: q.image.url } : null, // 🔥 `image` を適切な形式で保持
      }));
    
      await saveQuizResult(userId, category, formattedAnswers);
      
    
      // `image` を含めた `incorrectAnswers` を作成
      const incorrectAnswers = formattedAnswers.filter(a => a.selectedAnswer !== a.correctAnswer);
      console.log("🔥 [Firestore] 間違えた問題を保存:", incorrectAnswers);
      await saveReviewQuestions(userId, incorrectAnswers);
    }
    
    
    
    
    
    sessionStorage.setItem("quizResults", JSON.stringify(updatedAnswers));
    sessionStorage.setItem("finalScore", JSON.stringify(score));
    sessionStorage.setItem("quizCategory", category);
    
    console.log("🏁 [完了] クイズ終了 - 結果画面へ");
    router.push("/result");
  },[userId, category]);

  const handleTimeout = useCallback(async () => {
    if (feedback || isTimeoutTriggered.current) return;
    isTimeoutTriggered.current = true; // ✅ タイムアウトの連続発火防止

    const question = shuffledQuizzes[currentQuestionIndex];
    if (!question) return;

    // **すでに追加されているかチェック**
    const alreadySaved = userAnswers.some(q => q.question === question.question);
    
    let updatedAnswers = userAnswers;
    
    if (!alreadySaved) {
      updatedAnswers = [
        ...userAnswers,
        { 
          question: question.question, 
          choices: question.choices, 
          correctAnswer: question.answer, 
          selectedAnswer: "時間切れ" ,image: question.image ? { url: question.image.url } : null, 
        },
      ];
      console.log("✅ [デバッグ] handleTimeout で追加されるデータ:", updatedAnswers);
      setUserAnswers(updatedAnswers);
    }
    setFeedback("incorrect");

    setTimeout(async () => {
      setFeedback(null);
      isTimeoutTriggered.current = false; // ✅ 次の問題でタイマーが正常に動作するようリセット

      if (currentQuestionIndex + 1 >= shuffledQuizzes.length) {
        // 🔥 **最終問題の結果を反映してから handleQuizEnd を実行**
        await handleQuizEnd(updatedAnswers);
      } else {
        setCurrentQuestionIndex((prev) => prev + 1);
        setTimeLeft(12); // ✅ 次の問題でタイマーをリセット
      }
    }, 1000);
}, [currentQuestionIndex, shuffledQuizzes, feedback, userAnswers, handleQuizEnd]);


  useEffect(() => {
    if (!quizStarted) return;
    if (timeLeft <= 0) {
      handleTimeout();
      return;
    }

    const timerId = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timerId);
  }, [timeLeft, quizStarted, handleTimeout]);

  useEffect(() => {
    const countdownTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(countdownTimer);
          setShowStartText(true);
          setTimeout(() => {
            setQuizStarted(true);
            setShowStartText(false);
            setTimeLeft(12);
          }, 1000);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownTimer);
  }, []);

  if (!quizStarted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f5e6ca] text-orange-500">
        <div className="text-center text-6xl md:text-9xl lg:text-10xl font-bold animate-fadeIn">
          {showStartText ? " スタート！" : ` ${countdown}`}
        </div>
      </div>
    );
  }

  if (!shuffledQuizzes || shuffledQuizzes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f5e6ca] text-gray-900 px-4 text-2xl font-bold text-center">
        🚫 クイズがありません。別のカテゴリーを試してください。
      </div>
    );
  }

  const question = shuffledQuizzes[currentQuestionIndex];
  if (!question) return null;

  const handleAnswer = async (choice: string) => {
    if (feedback || isTimeoutTriggered.current) return;
    isTimeoutTriggered.current = true;
    const question = shuffledQuizzes[currentQuestionIndex];
    const isCorrect = choice === question.answer;
  
    const updatedAnswers: QuizResult[] = [
      ...userAnswers,
      { 
        question: question.question, 
        choices: question.choices, 
        correctAnswer: question.answer, 
        selectedAnswer: choice,
        image: question.image ? { url: question.image.url } : null, // 🔥 ここで明示的にセット
      },
    ];
  
    console.log("✅ [デバッグ] handleAnswer で追加されるデータ:", updatedAnswers); // 🔍 `image` があるか確認
    setUserAnswers(updatedAnswers);
  
    setUserAnswers(updatedAnswers);

    if (isCorrect) {
      setScore((prevScore) => prevScore + 1);
    }

    setFeedback(isCorrect ? "correct" : "incorrect");

  if (currentQuestionIndex + 1 >= shuffledQuizzes.length) {
    await handleQuizEnd(updatedAnswers); // ✅ **最終問題なら即終了処理**
    return;
  }

  setTimeout(() => {
    setFeedback(null);
    setCurrentQuestionIndex((prev) => prev + 1);
    setTimeLeft(12);
    isTimeoutTriggered.current = false; // ✅ 次の問題のためにフラグをリセット
  }, 1000);
};

  

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-[#f5e6ca] text-gray-900 px-4 pt-12">
      
      <Timer timeLeft={timeLeft} currentQuestionIndex={currentQuestionIndex} />





      <div className="relative bg-white p-8 mx-8 sm:p-10 md:p-16 rounded-lg shadow-xl w-full max-w-4xl text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">{question?.question}</h2>

        {question.image && (
          <div className="flex justify-center mt-2">
            <Image src={question.image.url} alt="問題画像" width={400} height={250} className="rounded-lg" />
          </div>
        )}

        <div className="mt-8 md:mt-10 space-y-8 flex flex-col items-center w-full">
          {question.choices.map((choice, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(choice)}
              className="block w-full max-w-2xl p-5 md:p-8 lg:p-7 border rounded-lg bg-gray-100 hover:bg-gray-200 transition text-xl md:text-2xl lg:text-3xl text-center"
            >
              {choice}
            </button>
          ))}
        </div>

        {/* ⭕️❌表示 */}
        {feedback && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <span className={`text-8xl font-bold ${feedback === "correct" ? "text-green-500" : "text-red-500"}`}>
              {feedback === "correct" ? "⭕️" : "❌"}
            </span>
          </div>
        )}

      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const category = context.query.category as string;
  let quizzes: Quiz[] = [];

  try {
    quizzes = await fetchQuizzes(category);
    console.log(`✅ クイズデータ (${category}):`, quizzes);
  } catch (error) {
    console.error("❌ クイズ取得エラー:", error);
  }

  return {
    props: { quizzes: quizzes || [] },
  };
};

export default QuizPage;
