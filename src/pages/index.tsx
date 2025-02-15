import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { fetchCategories } from "../lib/api"; // ✅ microCMSからカテゴリーを取得
import { fetchCategoryAccuracy, fetchRankings, getUser } from "../lib/firestore"; // ✅ Firestoreを利用
import Layout from "@/components/Layout";

interface Ranking {
  nickname: string;
  clearCount: number;
}

export default function Home() {
  const router = useRouter();
  const [categories, setCategories] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [categoryAccuracy, setCategoryAccuracy] = useState<{ [key: string]: { totalAttempts: number; correctAnswers: number } }>({});
  const [nickname, setNickname] = useState<string | null>(null);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("🔍 [Home] ページマウント時にデータ取得開始");

    const auth = sessionStorage.getItem("authenticated");
    if (!auth) {
      console.warn("⚠ [認証エラー] ログインしていないためリダイレクト");
      router.push("/password");
      return;
    }
    setIsAuthenticated(true);

    const storedUserId = sessionStorage.getItem("userId");
    if (!storedUserId) {
      console.error("❌ [エラー] sessionStorage に userId がありません。");
      return;
    }
    console.log(`🔍 [ユーザーID] ${storedUserId}`);

    // 🔥 **データ取得処理を並行処理**
    const fetchData = async () => {
      try {
        console.log("🔄 [データ取得] Firestore & microCMS からデータ取得開始");

        const [user, microCMSCategories, accuracyData, rankingData] = await Promise.all([
          getUser(storedUserId).catch((err: unknown) => {
            console.error("❌ [getUser] ユーザー情報の取得に失敗:", err);
            return null;
          }),
          fetchCategories().catch((err: unknown) => {
            console.error("❌ [fetchMicroCMSCategories] microCMS のカテゴリー取得に失敗:", err);
            return [];
          }),
          fetchCategoryAccuracy(storedUserId).catch((err: unknown) => {
            console.error("❌ [fetchCategoryAccuracy] 正答率データの取得に失敗:", err);
            return {};
          }),
          fetchRankings().catch((err: unknown) => {
            console.error("❌ [fetchRankings] ランキングデータの取得に失敗:", err);
            return [];
          }),
        ]);

        console.log("✅ [データ取得完了]", {
          user,
          microCMSCategories,
          accuracyData,
          rankingData,
        });

        if (user) setNickname(user.nickname);
        setCategories(microCMSCategories || []);
        setCategoryAccuracy(accuracyData || {});
        setRankings(rankingData || []);
      } catch (error) {
        console.error("❌ [データ取得エラー] fetchData 処理中にエラーが発生:", error);
      } finally {
        setLoading(false);
        console.log("🏁 [データ取得完了]");
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = () => {
    console.log("🚪 [ログアウト] ユーザーがログアウトしました");
    sessionStorage.removeItem("authenticated");
    sessionStorage.removeItem("userId");
    router.push("/password");
  };

  const handleCategorySelect = (category: string) => {
    console.log(`📚 [カテゴリー選択] ${category}`);
    router.push(`/quiz?category=${category}`);
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen text-2xl font-bold">
          🔄 データを読み込んでいます...
        </div>
      </Layout>
    );
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

        {/* ✅ カテゴリー選択 */}
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

        {/* ✅ ランキング表示 */}
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

        {/* ✅ ログアウトボタン */}
        <button onClick={handleLogout} className="bg-red-500 text-white p-4 rounded-lg font-bold">
          ログアウト
        </button>
      </div>
    </Layout>
  );
}
