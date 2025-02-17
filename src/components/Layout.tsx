import { ReactNode, useEffect, useState } from "react";
import Image from "next/image";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [fallingItems, setFallingItems] = useState<
    { id: number; left: number; delay: number; content: ReactNode }[]
  >([]);

  useEffect(() => {
    const newItems = Array.from({ length: 20 }).map((_, index) => {
      const isCoffeeBean = Math.random() < 0.6; // **コーヒー豆の出現率を高める (70%)**
      return {
        id: index,
        left: Math.random() * 100, // 横位置をランダムに
        delay: Math.random() * 5, // アニメーションの開始をランダムに
        content: isCoffeeBean ? (
          <Image
            src="/coffee-bean-removebg-preview.png" // **コーヒー豆の画像**
            alt="Coffee Bean"
            width={50}
            height={50}
            priority // ✅ ビルド時の最適化
            className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16"
          />
        ) : (
          <span className="text-4xl md:text-5xl lg:text-6xl">☕️</span>
        ),
      };
    });

    setFallingItems(newItems);
  }, []); // ✅ 依存配列を `[]` にして `useEffect` が 1 回だけ実行されるように

  return (
    <div className="relative min-h-screen bg-[#f5e6ca] text-gray-900">
      {/* ✅ 背景アニメーション */}
      <div className="fixed inset-0 w-full h-full pointer-events-none">
        {fallingItems.map((item) => (
          <span
            key={item.id}
            className="absolute animate-fall"
            style={{
              left: `${item.left}%`,
              top: `-10%`,
              animationDelay: `${item.delay}s`,
            }}
          >
            {item.content}
          </span>
        ))}
      </div>

      {/* ✅ メインコンテンツ */}
      <div className="relative z-10">{children}</div>

      {/* ✅ Tailwind CSS のカスタムアニメーション */}
      <style jsx global>{`
        @keyframes fall {
          0% {
            transform: translateY(-5%) rotate(0deg);
          }
          100% {
            transform: translateY(110vh) rotate(360deg); /* 画面外まで落下 */
          }
        }

        .animate-fall {
          position: absolute;
          animation-name: fall;
          animation-timing-function: linear;
          animation-duration: 7s; /* 速度調整 */
          animation-iteration-count: infinite;
          animation-fill-mode: forwards;
        }
      `}</style>
    </div>
  );
}
