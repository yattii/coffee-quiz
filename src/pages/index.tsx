import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { fetchCategories } from "../lib/api";
import Layout from "@/components/Layout";

interface User {
  userId: string;
  nickname: string;
}

interface Ranking {
  nickname: string;
  clearCount: number;
}

export default function Home() {
  const router = useRouter();
  const [categories, setCategories] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [categoryAccuracy, setCategoryAccuracy] = useState<{ [key: string]: { totalAttempts: number; correctAnswers: number } }>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [rankings, setRankings] = useState<Ranking[]>([]);

  useEffect(() => {
    const auth = sessionStorage.getItem("authenticated");
    if (!auth) {
      router.push("/password");
    } else {
      setIsAuthenticated(true);
    }

    const storedUserId = sessionStorage.getItem("userId");
    setUserId(storedUserId);

    if (storedUserId) {
      const registeredUsers: User[] = JSON.parse(localStorage.getItem("registeredUsers") || "[]");
      const user = registeredUsers.find((user) => user.userId === storedUserId);
      if (user) {
        setNickname(user.nickname);
      }

      updateCategoryAccuracy(storedUserId);
      updateRankings(registeredUsers);
    }

    fetchCategories().then(setCategories);
  }, []);

  const updateCategoryAccuracy = (userId: string) => {
    const accuracyData = JSON.parse(localStorage.getItem(`accuracy_${userId}`) || "{}");
    setCategoryAccuracy(accuracyData);
  };

  const updateRankings = (users: User[]) => {
    const rankingsData: Ranking[] = users.map((user) => {
      const accuracyData: { [key: string]: { totalAttempts: number; correctAnswers: number } } =
        JSON.parse(localStorage.getItem(`accuracy_${user.userId}`) || "{}");

      const clearCount = Object.values(accuracyData).filter(
        (data) => data.correctAnswers === data.totalAttempts && data.totalAttempts > 0
      ).length;

      return { nickname: user.nickname, clearCount };
    });

    rankingsData.sort((a: Ranking, b: Ranking) => b.clearCount - a.clearCount);
    setRankings(rankingsData);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("authenticated");
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("previousLogin");
    router.push("/password");
  };

  const handleCategorySelect = (category: string) => {
    router.push(`/quiz?category=${category}`);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-screen py-12 space-y-12">

        {/* ✅ ようこそ！ ユーザーカード */}
        {nickname && (
          <div className="bg-blue-100 p-6 sm:p-8 md:p-10 rounded-lg shadow-md max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-3xl w-full text-center">
            <h2 className="text-xl md:text-2xl font-bold text-blue-800">ようこそ！{nickname} さん 🎉</h2>
          </div>
        )}

        {/* ✅ カテゴリー選択 (スクロール可能) */}
        <div className="bg-white p-6 sm:p-8 md:p-12 rounded-lg shadow-xl max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-3xl w-full text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">📚 カテゴリーを選択</h2>
          <div className="max-h-[400px] lg:max-h-[500px] overflow-y-auto space-y-3 md:space-y-4">
            {categories.length === 0 ? (
              <p>カテゴリーがありません。</p>
            ) : (
              categories.map((category) => {
                const accuracy = categoryAccuracy[category] || { totalAttempts: 10, correctAnswers: 0 };
                const isCleared = accuracy.correctAnswers === accuracy.totalAttempts && accuracy.totalAttempts > 0;

                return (
                  <button
                    key={category}
                    onClick={() => handleCategorySelect(category)}
                    className="block w-full p-4 md:p-5 border rounded-lg bg-gray-100 hover:bg-gray-200 transition text-lg md:text-xl"
                  >
                    {category} ({accuracy.correctAnswers}/{accuracy.totalAttempts}) {isCleared && "🎉クリア！"}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ✅ クリア！ランキング (スクロール可能) */}
        <div className="bg-white p-6 sm:p-8 md:p-12 rounded-lg shadow-xl max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-3xl w-full text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">🏆 クリア！ ランキング</h2>
          <div className="max-h-[300px] lg:max-h-[400px] overflow-y-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 p-3 md:p-4 text-sm md:text-lg">順位</th>
                  <th className="border border-gray-300 p-3 md:p-4 text-sm md:text-lg">ユーザー</th>
                  <th className="border border-gray-300 p-3 md:p-4 text-sm md:text-lg">クリア！数</th>
                </tr>
              </thead>
              <tbody>
                {rankings.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="border border-gray-300 p-3 md:p-4 text-center">
                      まだクリアしたユーザーはいません。
                    </td>
                  </tr>
                ) : (
                  rankings.map((user, index) => (
                    <tr key={index} className="text-center">
                      <td className="border border-gray-300 p-3 md:p-4">{index + 1}</td>
                      <td className="border border-gray-300 p-3 md:p-4">{user.nickname}</td>
                      <td className="border border-gray-300 p-3 md:p-4">{user.clearCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ✅ ログアウトボタン (ランキングの下) */}
        <button
          onClick={handleLogout}
          className="w-full max-w-sm sm:max-w-md md:max-w-xl lg:max-w-2xl bg-red-500 hover:bg-red-600 text-white p-4 md:p-5 rounded-lg font-bold text-lg md:text-xl transition mt-6"
        >
          ログアウト
        </button>
      </div>
    </Layout>
  );
}
