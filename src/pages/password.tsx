import { useState } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";

const FIXED_PASSWORD = "1"; // 固定パスワード

export default function PasswordPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // ✅ **登録済みユーザーを取得**
  const getRegisteredUsers = (): { userId: string; nickname: string }[] => {
    try {
      const users = localStorage.getItem("registeredUsers");
      if (!users) return [];

      const parsedUsers = JSON.parse(users);
      return Array.isArray(parsedUsers) ? parsedUsers : [];
    } catch (error) {
      console.error("❌ `registeredUsers` の解析に失敗:", error);
      return [];
    }
  };

  // ✅ **ログイン処理**
  const handleLogin = () => {
    if (!/^\d+$/.test(userId)) {
      setError("ユーザーIDは数字のみで入力してください。");
      return;
    }

    const users = getRegisteredUsers();
    if (users.length === 0) {
      setError("登録されたユーザーがいません。");
      return;
    }

    const user = users.find((user) => user?.userId === userId);
    if (!user) {
      setError("このユーザーIDは登録されていません。");
      return;
    }

    if (password !== FIXED_PASSWORD) {
      setError("パスワードが間違っています。");
      return;
    }

    // ✅ **ログイン情報を保存**
    const now = new Date().toLocaleString();
    localStorage.setItem(`lastLogin_${userId}`, now);
    sessionStorage.setItem("authenticated", "true");
    sessionStorage.setItem("userId", user.userId);
    sessionStorage.setItem("nickname", user.nickname);

    console.log("📌 ログイン成功:", user);
    router.push("/");
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-white p-6 sm:p-8 md:p-12 rounded-lg shadow-xl max-w-sm sm:max-w-md md:max-w-xl lg:max-w-2xl w-full">
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
            新規登録
          </button>
        </div>
      </div>
    </Layout>
  );
}



// WEBページで検証してコンソールに入力

// ユーザーID・ニックネームの確認

// console.log(JSON.parse(localStorage.getItem("registeredUsers")));


// ユーザーの削除


// // **全ユーザーを削除**

// localStorage.removeItem("registeredUsers"); // ユーザー一覧を削除

// // **正答率やログイン履歴を削除**
// Object.keys(localStorage).forEach((key) => {
//   if (key.startsWith("accuracy_") || key.startsWith("lastLogin_")) {
//     localStorage.removeItem(key);
//   }
// });

// console.log("全ユーザーとその関連データを削除しました。");




// 特定のユーザーを削除


// const userIdToDelete = "1"; // 削除したいユーザーのID
// let users = JSON.parse(localStorage.getItem("registeredUsers") || "[]");

// // ユーザーを削除
// users = users.filter(user => user.userId !== userIdToDelete);
// localStorage.setItem("registeredUsers", JSON.stringify(users));

// // **ユーザーの関連データを削除**
// localStorage.removeItem(`accuracy_${userIdToDelete}`);  // 正答率データを削除
// localStorage.removeItem(`lastLogin_${userIdToDelete}`); // 最終ログイン日時を削除

// console.log(`ユーザーID ${userIdToDelete} を削除し、関連データもリセットしました。`);