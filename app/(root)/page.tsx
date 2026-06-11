"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/app/lib/api/user";
import { UserType } from "@/app/lib/types";
import Image from "next/image";
import gsap from "gsap";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  // Рефы для GSAP
  const heroRef = useRef<HTMLDivElement>(null);
  const droneImageRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        } else {
          router.push("/sign-in");
        }
      } catch (error) {
        console.error("Auth error:", error);
        router.push("/sign-in");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Анимации после загрузки данных и рендера
  useEffect(() => {
    if (!loading && user) {
      const tl = gsap.timeline();

      // Анимация текста заголовка
      tl.fromTo(
        textRef.current?.children || [],
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, stagger: 0.2, ease: "power3.out" }
      );

      // Анимация появления дрона (вылет снизу)
      tl.fromTo(
        droneImageRef.current,
        { scale: 0.8, opacity: 0, rotation: -10 },
        { scale: 1, opacity: 1, rotation: 0, duration: 1.5, ease: "elastic.out(1, 0.75)" },
        "-=0.8"
      );

      // Постоянная левитация дрона
      gsap.to(droneImageRef.current, {
        y: -20,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // Появление блока с преимуществами
      gsap.fromTo(
        featuresRef.current?.children || [],
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, scrollTrigger: featuresRef.current }
      );
    }
  }, [loading, user]);

  // Обработка движения мыши для параллакса дрона
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!droneImageRef.current) return;
    
    const x = (window.innerWidth / 2 - e.pageX) / 25;
    const y = (window.innerHeight / 2 - e.pageY) / 25;

    gsap.to(droneImageRef.current, {
      rotationY: x,
      rotationX: y,
      ease: "power1.out",
      duration: 0.5,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#84b1cb]"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-neutral-50 overflow-x-hidden" onMouseMove={handleMouseMove}>

      {/* Hero Section */}
      <section ref={heroRef} className="relative pt-20 pb-32 lg:pt-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Text Content */}
            <div ref={textRef} className="space-y-8">
              <h1 className="text-5xl md:text-7xl font-bold text-neutral-900 tracking-tight leading-tight">
                Управляй будущим <br />
                <span className="text-[#84b1cb]">с EDrone</span>
              </h1>
              <p className="text-xl text-neutral-600 max-w-lg">
                Профессиональное обучение пилотированию дронов, симуляторы и реальные полеты. Начни свой путь в небо уже сегодня.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => router.push('/lessons')}
                  className="px-8 py-4 bg-black text-white rounded-full font-semibold hover:bg-neutral-800 transition-all transform hover:scale-105 shadow-lg"
                >
                  Начать обучение
                </button>
                <button className="px-8 py-4 bg-white text-neutral-900 border border-neutral-200 rounded-full font-semibold hover:bg-neutral-50 transition-all">
                  Узнать больше
                </button>
              </div>

              {/* Stats */}
              <div className="pt-8 flex gap-8 border-t border-neutral-200">
                <div>
                  <p className="text-3xl font-bold text-neutral-900">500+</p>
                  <p className="text-sm text-neutral-500">Выпускников</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-neutral-900">50+</p>
                  <p className="text-sm text-neutral-500">Тренеров</p>
                </div>
              </div>
            </div>

            {/* Drone Image */}
            <div className="relative lg:h-[600px] flex items-center justify-center perspective-1000">
              <div ref={droneImageRef} className="relative w-full max-w-lg drop-shadow-2xl">
                {/* Используем предоставленное изображение или заглушку, если файл не найден */}
                <Image 
                  src="/images/drone.png" // Убедитесь, что картинка лежит в public/images/
                  alt="Racing Drone" 
                  width={800} 
                  height={800} 
                  priority
                  className="w-full h-auto object-contain"
                />
                
                {/* Декоративные элементы (круги на фоне) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#84b1cb]/10 rounded-full blur-3xl -z-10"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">Почему выбирают нас</h2>
            <p className="text-neutral-500 max-w-2xl mx-auto">Мы предоставляем лучший опыт обучения пилотированию квадрокоптеров в стране.</p>
          </div>

          <div ref={featuresRef} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Опытные тренеры", desc: "Сертифицированные пилоты с реальным опытом гонок.", icon: "🎓" },
              { title: "Современное оборудование", desc: "Дроны последнего поколения и профессиональные симуляторы.", icon: "🚁" },
              { title: "Индивидуальный подход", desc: "Персональный план обучения под ваши цели и уровень.", icon: "🎯" },
            ].map((feature, index) => (
              <div key={index} className="p-8 rounded-2xl bg-neutral-50 hover:bg-white hover:shadow-xl transition-all duration-300 border border-neutral-100 group">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                <h3 className="text-xl font-bold text-neutral-900 mb-2">{feature.title}</h3>
                <p className="text-neutral-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Simple */}
      <footer className="bg-neutral-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-neutral-400">© 2026 EDrone. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
}