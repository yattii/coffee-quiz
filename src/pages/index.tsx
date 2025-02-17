import { useRouter } from "next/router";
import { useEffect, useState, useCallback, useTransition } from "react";
import { fetchCategories } from "../lib/api"; // ✅ microCMS
import { fetchCategoryAccuracy, fetchRankings, getUser } from "../lib/firestore"; // ✅ Firestore を利用
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
  const [isTransitioning, startTransition] = useTransition(); // ✅ 遷移の最適化

  useEffect(() => {
    console.log("🔍 [Home] ページマウント時にデータ取得開始");

    const auth = sessionStorage.getItem("authenticated");
    if (!auth) {
      console.warn("⚠ [認証エラー] ログインしていないためリダイレクト");
      router.replace("/password");
      return;
    }
    setIsAuthenticated(true);

    const storedUserId = sessionStorage.getItem("userId");
    if (!storedUserId) {
      console.error("❌ [エラー] sessionStorage に userId がありません。");
      return;
    }
    console.log(`🔍 [ユーザーID] ${storedUserId}`);

    const fetchData = async () => {
      try {
        console.log("🔄 [データ取得] Firestore & microCMS からデータ取得開始");

        const [user, microCMSCategories, accuracyData, rankingData] = await Promise.all([
          getUser(storedUserId).catch((err) => {
            console.error("❌ [getUser] ユーザー情報の取得に失敗:", err);
            return null;
          }),
          fetchCategories().catch((err) => {
            console.error("❌ [fetchCategories] microCMS のカテゴリー取得に失敗:", err);
            return [];
          }),
          fetchCategoryAccuracy(storedUserId).catch((err) => {
            console.error("❌ [fetchCategoryAccuracy] 正答率データの取得に失敗:", err);
            return {};
          }),
          fetchRankings().catch((err) => {
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
        setRankings(rankingData || {});

        // 🔥 **事前にクイズページをプリフェッチ**
        microCMSCategories.forEach((category) => {
          router.prefetch(`/quiz?category=${category}`);
        });

      } catch (error) {
        console.error("❌ [データ取得エラー] fetchData 処理中にエラーが発生:", error);
      } finally {
        setLoading(false);
        console.log("🏁 [データ取得完了]");
      }
    };

    fetchData();
  }, [router]);

  // ✅ **カテゴリー選択時の処理**
  const handleCategorySelect = useCallback((category: string) => {
    console.log(`📚 [カテゴリー選択] ${category}`);

    startTransition(() => {
      router.push(`/quiz?category=${category}`);
    });
  }, [router, startTransition]);

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
          <p className="mt-4 text-2xl font-bold">データを読み込んでいます...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-screen py-12 space-y-12">

        {/* ✅ ようこそ！ ユーザーカード */}
        {nickname && (
          <div className="bg-blue-100 p-6 sm:p-8 md:p-10 rounded-lg shadow-md max-w-3xl w-full text-center">
            <h2 className="text-xl md:text-2xl font-bold text-blue-800">ようこそ！{nickname} さん 🎉</h2>
          </div>
        )}

        {/* ✅ カテゴリー選択 */}
        <div className="bg-white p-6 sm:p-8 md:p-12 rounded-lg shadow-xl max-w-3xl w-full text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">📚 カテゴリーを選択</h2>
          <div className="max-h-[400px] overflow-y-auto space-y-3">
            {categories.length === 0 ? (
              <p>カテゴリーがありません。</p>
            ) : (
              categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategorySelect(category)}
                  disabled={isTransitioning} // ✅ 遷移中はクリック不可
                  className={`block w-full p-4 border rounded-lg ${
                    isTransitioning ? "bg-gray-300 cursor-not-allowed" : "bg-gray-100 hover:bg-gray-200"
                  } transition text-lg`}
                >
                  {category}
                </button>
              ))
            )}
          </div>
        </div>

        {/* ✅ ローディングスピナー */}
        {isTransitioning && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-white"></div>
          </div>
        )}
      </div>
    </Layout>
  );
}
