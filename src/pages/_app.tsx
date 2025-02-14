import "@/styles/globals.css"; // ✅ Tailwind を適用
import type { AppProps } from "next/app";
import Head from "next/head"; // ✅ Head をインポート

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      {/* ✅ すべてのページに適用されるタイトルとメタ情報 */}
      <Head>
        <title>イン前３分！コーヒークイズ - 楽しく学んでブラックエプロンを取ろう！</title>  {/* ← 好きなタイトルに変更 */}
        <meta name="description" content="イン前３分！コーヒークイズ！" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* ✅ 各ページのコンポーネントを表示 */}
      <Component {...pageProps} />
    </>
  );
}

// git add .
// git commit -m "fix"
// git push origin main