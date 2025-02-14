import { GetServerSideProps } from "next";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { fetchQuizzes } from "../lib/api";

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

interface QuizProps {
  quizzes: Quiz[];
}

const QuizPage: React.FC<QuizProps> = ({ quizzes = [] }) => {
  const [shuffledQuizzes, setShuffledQuizzes] = useState<Quiz[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ question: string; correctAnswer: string; selectedAnswer: string }[]>([]);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [timeLeft, setTimeLeft] = useState(12);
  const [countdown, setCountdown] = useState(3);
  const [quizStarted, setQuizStarted] = useState(false);
  const [showStartText, setShowStartText] = useState(false);
  const router = useRouter();
  const category = router.query.category as string;

  // ✅ クイズデータをデバッグ
  useEffect(() => {
    console.log("取得したクイズデータ:", quizzes);
  }, [quizzes]);

  useEffect(() => {
    if (!quizzes || quizzes.length === 0) {
      console.warn("⚠ クイズデータが空です。");
      return;
    }

    const shuffled = shuffleArray(quizzes).map((q) => ({
      ...q,
      choices: shuffleArray(q.choices),
    }));
    setShuffledQuizzes(shuffled);
  }, [quizzes]);

  useEffect(() => {
    if (!quizStarted) return;
    setTimeLeft(12);
  }, [currentQuestionIndex, quizStarted]);

  const handleTimeout = useCallback(() => {
    if (feedback) return;

    const question = shuffledQuizzes[currentQuestionIndex];
    if (!question) return;

    const updatedAnswers = [
      ...userAnswers,
      { question: question.question, correctAnswer: question.answer, selectedAnswer: "時間切れ" },
    ];
    setUserAnswers(updatedAnswers);

    setFeedback("incorrect");

    setTimeout(() => {
      setFeedback(null);
      if (currentQuestionIndex + 1 >= shuffledQuizzes.length) {
        sessionStorage.setItem("quizResults", JSON.stringify(updatedAnswers));
        sessionStorage.setItem("finalScore", JSON.stringify(score));
        sessionStorage.setItem("quizCategory", category);
        router.push("/result");
      } else {
        setCurrentQuestionIndex((prev) => prev + 1);
      }
    }, 1000);
  }, [currentQuestionIndex, shuffledQuizzes, feedback, score, category, router, userAnswers]);

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
          {showStartText ? "🎯 スタート！" : ` ${countdown}`}
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

  const handleAnswer = (choice: string) => {
    if (feedback) return;
    const isCorrect = choice === question.answer;

    const updatedAnswers = [
      ...userAnswers,
      { question: question.question, correctAnswer: question.answer, selectedAnswer: choice },
    ];
    setUserAnswers(updatedAnswers);

    if (isCorrect) {
      setScore((prevScore) => prevScore + 1);
    }

    setFeedback(isCorrect ? "correct" : "incorrect");

    setTimeout(() => {
      setFeedback(null);
      if (currentQuestionIndex + 1 >= shuffledQuizzes.length) {
        sessionStorage.setItem("quizResults", JSON.stringify(updatedAnswers));
        sessionStorage.setItem("finalScore", JSON.stringify(score + (isCorrect ? 1 : 0)));
        sessionStorage.setItem("quizCategory", category);
        router.push("/result");
      } else {
        setCurrentQuestionIndex((prev) => prev + 1);
      }
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-[#f5e6ca] text-gray-900 px-4 pt-12">
      <div className="w-full max-w-4xl flex justify-center mb-6">
        <div className="text-3xl md:text-4xl font-bold bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg">
          ⏳ {timeLeft} 秒
        </div>
      </div>

      <div className="relative bg-white p-8 sm:p-10 md:p-16 rounded-lg shadow-xl w-full max-w-4xl text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">{question?.question}</h2>

        {question.image && (
          <div className="flex justify-center mt-24">
            <Image src={question.image.url} alt="問題画像" width={400} height={250} className="rounded-lg" />
          </div>
        )}

        {/* 選択肢 */}
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
