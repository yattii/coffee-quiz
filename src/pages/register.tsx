import { useState } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";

export default function RegisterPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");

  // ✅ **登録済みのユーザーを取得**
  const getRegisteredUsers = (): { userId: string; nickname: string }[] => {
    try {
      const usersData = localStorage.getItem("registeredUsers");
      if (!usersData) return [];
      const users = JSON.parse(usersData);
      return Array.isArray(users) ? users : [];
    } catch (error) {
      console.error("ユーザー取得エラー:", error);
      return [];
    }
  };

  // ✅ **ユーザー登録処理**
  const handleRegister = () => {
    if (!/^\d+$/.test(userId)) {
      setError("ユーザーIDは数字のみで入力してください。");
      return;
    }
    if (!nickname.trim()) {
      setError("ニックネームを入力してください。");
      return;
    }

    const users = getRegisteredUsers();
    if (!Array.isArray(users)) {
      setError("登録データの取得に失敗しました。");
      return;
    }

    if (users.some((user) => user?.userId === userId)) {
      setError("このユーザーIDはすでに登録されています。");
      return;
    }

    users.push({ userId, nickname });
    localStorage.setItem("registeredUsers", JSON.stringify(users));

    alert("ユーザー登録が完了しました！ログインしてください。");
    router.push("/password");
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-white p-6 sm:p-8 md:p-12 rounded-lg shadow-xl max-w-sm sm:max-w-md md:max-w-xl lg:max-w-2xl w-full">
          <h1 className="text-3xl font-bold text-center mb-6">新規ユーザー登録</h1>
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}

          <div className="mb-6">
            <label className="block text-left font-semibold">ユーザーID（社員番号）</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-lg"
              placeholder="例: 12345"
              pattern="\d*"
            />
          </div>

          <div className="mb-8">
            <label className="block text-left font-semibold">ニックネーム（自由に設定）</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-lg"
              placeholder="例: Taro"
            />
          </div>

          <button
            onClick={handleRegister}
            className="w-full bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg font-bold text-lg transition"
          >
            登録
          </button>

          <button
            onClick={() => router.push("/password")}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white p-4 mt-4 rounded-lg font-bold text-lg transition"
          >
            ログインページへ
          </button>
        </div>
      </div>
    </Layout>
  );
}
