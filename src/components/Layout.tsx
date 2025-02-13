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
    const icons = ["☕️"];
    const newItems = Array.from({ length: 18 }).map((_, index) => {
      const isCoffeeBean = Math.random() < 0.5; // **コーヒー豆の出現率を高める (70%)**
      return {
        id: index,
        left: Math.random() * 100, // 横位置をランダムに
        delay: Math.random() * 5, // アニメーションの開始をランダムに
        content: isCoffeeBean ? (
          <Image
            src="/coffee-bean-removebg-preview.png" // **コーヒー豆の画像**
            alt="Coffee Bean"
            width={50} // **サイズを統一**
            height={50}
            className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16"
          />
        ) : (
          <span className="text-4xl md:text-5xl lg:text-6xl">☕️</span> // **サイズを統一**
        ),
      };
    });

    setFallingItems(newItems);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#f5e6ca] text-gray-900 overflow-visible">
      {/* ✅ 背景アニメーション (fixed でスクロール後も消えない) */}
      <div className="fixed inset-0 w-full h-[200vh] overflow-visible">
        {fallingItems.map((item) => (
          <span
            key={item.id}
            className="absolute animate-fall"
            style={{
              left: `${item.left}%`,
              top: `-5%`,
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
            transform: translateY(120vh) rotate(360deg); /* 画面外まで落下 */
          }
        }

        .animate-fall {
          position: absolute;
          animation-name: fall;
          animation-timing-function: linear;
          animation-duration: 5s; /* 速度は変更せず維持 */
          animation-iteration-count: infinite;
          animation-fill-mode: forwards;
        }
      `}</style>
    </div>
  );
}
