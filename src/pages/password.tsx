import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { getUser, updateLastLogin } from "../lib/firestore"; // ✅ Firestore を使用

const FIXED_PASSWORD = "4061"; // 固定パスワード

export default function PasswordPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0); // 🔥 このページを開いたらスクロールを一番上へ
  }, []);

  // ✅ **ログイン処理**
  const handleLogin = async () => {
    if (!/^\d+$/.test(userId)) {
      setError("ユーザーIDは数字のみで入力してください。");
      return;
    }

    try {
      const user = await getUser(userId); // ✅ Firestore からユーザー取得
      if (!user) {
        setError("このユーザーIDは登録されていません。");
        return;
      }

      if (password !== FIXED_PASSWORD) {
        setError("パスワードが間違っています。");
        return;
      }

      // ✅ **ログイン履歴を Firestore に保存**
      await updateLastLogin(userId);

      // ✅ **ログイン情報を保存**
      sessionStorage.setItem("authenticated", "true");
      sessionStorage.setItem("userId", user.userId);
      sessionStorage.setItem("nickname", user.nickname);

      console.log("📌 ログイン成功:", user);
      router.push("/");
    } catch (error) {
      console.error("❌ ログインエラー:", error);
      setError("ログイン処理中にエラーが発生しました。");
    }
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-screen space-y-10 mx-8">

        {/* ✅ タイトルカード */}
        <div className="bg-orange-200 p-6 sm:p-8 md:p-10 rounded-lg shadow-md max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-3xl w-full text-center mt-16">
          <h1 className="text-2xl md:text-4xl font-bold text-orange-800"><p className="text-red-500">イン前３分！</p>コーヒークイズ</h1>
          <p className="text-base md:text-xl text-gray-700 mt-2">楽しく学んでブラックエプロンを取ろう！</p>
        </div>

        <div className="bg-white p-6 sm:p-8 md:p-12 rounded-lg shadow-xl max-w-sm sm:max-w-md md:max-w-xl lg:max-w-2xl w-full mb-16">
          <h1 className="text-3xl font-bold text-center mb-6">ログイン</h1>
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}

          <div className="mb-6">
            <label className="block text-left font-semibold">ユーザーID（社員番号）</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              placeholder="例: 12345"
              pattern="\d*"
            />
          </div>

          <div className="mb-8">
            <label className="block text-left font-semibold">パスワード（固定）</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              placeholder="パスワードを入力"
            />
          </div>

          <button
            onClick={handleLogin}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg font-bold text-lg transition"
          >
            ログイン
          </button>

          <button
            onClick={() => router.push("/register")}
            className="w-full bg-gray-500 hover:bg-gray-600 text-white p-4 mt-4 rounded-lg font-bold text-lg transition"
          >
            新規登録ページへ
          </button>
        </div>
      </div>
    </Layout>
  );
}
