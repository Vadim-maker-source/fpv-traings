"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TeacherType, UserType } from "../lib/types";
import { Role } from "@prisma/client";
import Image from "next/image";
import { getCurrentUser } from "../lib/api/user";

const faqData = [
  {
    question: "Нужен ли свой дрон для обучения?",
    answer: "Нет, обучение происходит с симуляторов."
  },
  {
    question: "Как записаться на курс?",
    answer: "Подайте заявку учителю и Вас добавят на персональный курс."
  },
  {
    question: "Не устраивает время, выбранное тренером?",
    answer: "Напишите в поддержку для регулировки времени."
  }
];

export default function Home() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<TeacherType[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentUserRole, setCurrentUserRole] = useState<Role | null>(null);
  const [user, setUser] = useState<UserType | null>(null);

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'confirm' | 'success' | 'error' | 'auth';
    message?: string;
    teacherId?: string;
  }>({ isOpen: false, type: 'confirm' });

  const [applyingId, setApplyingId] = useState<string | null>(null);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<{ text: string; isBot: boolean }[]>([
    { text: "Привет! 👋 Я виртуальный помощник EDrone. Чем могу помочь?", isBot: true }
  ]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  useEffect(() => {
    const initData = async () => {
      try {
        const res = await fetch("/api/users/teachers");
        const data = await res.json();
        setTeachers(data.teachers || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }

      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        if (user?.role) {
          setCurrentUserRole(user.role);
        }
      } catch (error) {
        console.error("Failed to fetch session", error);
      }
    };

    initData();
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg = inputValue;
    setMessages(prev => [...prev, { text: userMsg, isBot: false }]);
    setInputValue("");

    setTimeout(() => {
      let botResponse = "Извините, я пока не понял вопрос. Попробуйте спросить про курсы, цены или расписание.";
      
      const lowerMsg = userMsg.toLowerCase();
      if (lowerMsg.includes("цена") || lowerMsg.includes("стоит") || lowerMsg.includes("сколько") || lowerMsg.includes("цены") || lowerMsg.includes("прайс")) {
        botResponse = "Стоимость обучения зависит от выбранного пакета. Базовый курс начинается от 15 000₽. Подробности можно узнать у тренера.";
      } else if (lowerMsg.includes("время") || lowerMsg.includes("расписание") || lowerMsg.includes("когда")) {
        botResponse = "Мы работаем ежедневно с 10:00 до 21:00. Занятия проходят по предварительной записи с тренером.";
      } else if (lowerMsg.includes("дрон") || lowerMsg.includes("оборудование")) {
        botResponse = "На первые занятия мы предоставляем дроны бесплатно. Свое оборудование лучше покупать после консультации с инструктором.";
      } else if (lowerMsg.includes("привет") || lowerMsg.includes("здравствуй")) {
        botResponse = "Здравствуйте! Готов ответить на ваши вопросы о школе пилотирования.";
      }
      else if (lowerMsg.includes("шмыг") || lowerMsg.includes("шмыгарян")) {
        botResponse = "ШУЕ.";
      }
      // else if (lowerMsg.includes("банан")) {
      //   botResponse = "Дай его ХАММАММ";
      // }
      // else if (lowerMsg.includes("плаксик")) {
      //   botResponse = "Шо?";
      // }
      // else if (lowerMsg.includes("спой") || lowerMsg.includes("споешь") || lowerMsg.includes("споёшь") || lowerMsg.includes("песню") || lowerMsg.includes("песня")) {
      //   botResponse = "Банан, банан, дай его хаммам. Банан, банан, дай его хаммам. Банан, банан, дай его хаммам.";
      // }
      // else if (lowerMsg.includes("цитата") || lowerMsg.includes("вова")) {
      //   botResponse = '"Я буду крутиться на твоем члене, если вы синхронизируете юнити"';
      // }

      setMessages(prev => [...prev, { text: botResponse, isBot: true }]);
    }, 1000);
  };

  const openConfirmModal = (teacherId: string) => {
    setModalState({ isOpen: true, type: 'confirm', teacherId });
  };

  const handleApplySubmit = async () => {
    if (!modalState.teacherId || applyingId) return;
    setApplyingId(modalState.teacherId);
    
    try {
      const res = await fetch("/api/request-teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId: modalState.teacherId }),
      });
      const result = await res.json();
      if (res.ok) setModalState({ isOpen: true, type: 'success' });
      else if (res.status === 401) setModalState({ isOpen: true, type: 'auth' });
      else setModalState({ isOpen: true, type: 'error', message: result.error });
    } catch (error) {
      setModalState({ isOpen: true, type: 'error', message: "Ошибка сети" });
    } finally {
      setApplyingId(null);
    }
  };

  const closeModal = () => {
    setModalState({ ...modalState, isOpen: false });
    if (modalState.type === 'auth') router.push("/sign-in");
  };

  return (
    <div className="min-h-screen text-[#364954] font-sans relative">
      
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
        
        {isChatOpen && (
          <div className="w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#a7c2d3]/30 overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300 origin-bottom-right h-[500px] max-h-[80vh]">
            {/* Header */}
            <div className="bg-[#364954] p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#84b1cb] rounded-full flex items-center justify-center text-white font-bold text-xs">AI</div>
                <div>
                  <h4 className="text-white font-semibold text-sm">Помощник EDrone</h4>
                  <span className="text-[#a7c2d3] text-xs flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> Онлайн
                  </span>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-white/70 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f8fafc]">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${
                    msg.isBot 
                      ? 'bg-white border border-[#a7c2d3]/20 text-[#364954] rounded-tl-none' 
                      : 'bg-[#364954] text-white rounded-tr-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-[#a7c2d3]/20 flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Напишите сообщение..."
                className="flex-1 bg-[#f8fafc] border border-[#a7c2d3]/30 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-[#84b1cb] text-[#364954]"
              />
              <button 
                type="submit"
                disabled={!inputValue.trim()}
                className="w-10 h-10 bg-[#364954] text-white rounded-full flex items-center justify-center hover:bg-[#84b1cb] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </form>
          </div>
        )}

        {/* Toggle Button */}
        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="w-14 h-14 bg-[#364954] text-white rounded-full shadow-lg hover:bg-[#84b1cb] hover:scale-110 transition-all duration-300 flex items-center justify-center group ring-4 ring-white"
        >
          {isChatOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          ) : (
            <svg className="w-7 h-7 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
          )}
        </button>
      </div>

      {/* --- Modal for Teacher Application --- */}
      {modalState.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative transform transition-all scale-100">
            <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-[#364954]">✕</button>
            
            {modalState.type === 'confirm' && (
              <div className="text-center">
                <div className="w-12 h-12 bg-[#a7c2d3]/20 rounded-full flex items-center justify-center mx-auto mb-4 text-[#364954]">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Подтверждение записи</h3>
                <p className="text-gray-600 mb-6">Вы хотите подать заявку этому тренеру?</p>
                <div className="flex gap-3 justify-center">
                  <button onClick={closeModal} className="px-5 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50">Отмена</button>
                  <button onClick={handleApplySubmit} disabled={!!applyingId} className="px-5 py-2.5 rounded-lg bg-[#364954] text-white hover:bg-[#84b1cb]">
                    {applyingId ? "..." : "Подтвердить"}
                  </button>
                </div>
              </div>
            )}
            {modalState.type === 'success' && (
               <div className="text-center py-4">
                 <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">✓</div>
                 <h3 className="text-xl font-bold mb-2">Заявка отправлена!</h3>
                 <button onClick={closeModal} className="mt-4 w-full py-3 bg-[#364954] text-white rounded-lg">Отлично</button>
               </div>
            )}
             {modalState.type === 'auth' && (
               <div className="text-center py-4">
                 <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">🔒</div>
                 <h3 className="text-xl font-bold mb-2">Требуется вход</h3>
                 <div className="flex gap-3 mt-4">
                   <button onClick={closeModal} className="flex-1 py-3 border rounded-lg">Позже</button>
                   <button onClick={() => router.push('/sign-in')} className="flex-1 py-3 bg-[#364954] text-white rounded-lg">Войти</button>
                 </div>
               </div>
            )}
             {modalState.type === 'error' && (
               <div className="text-center py-4">
                 <h3 className="text-xl font-bold mb-2 text-red-600">Ошибка</h3>
                 <p className="text-gray-600 mb-4">{modalState.message}</p>
                 <button onClick={closeModal} className="w-full py-3 bg-gray-100 rounded-lg">Закрыть</button>
               </div>
            )}
          </div>
        </div>
      )}

      <section className="pt-20 pb-16 lg:pt-32 lg:pb-24 px-4">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Стань пилотом <br/> <span className="text-white">будущего</span>
            </h1>
            <p className="text-lg text-[#364954]/70 max-w-md">
              Онлайн тренажер управления FPV-дроном. Обучение на симуляторе.
            </p>
            <div className="flex gap-4 pt-4">
              <button onClick={() => router.push('/#teachers')} className="px-8 py-3 bg-[#364954] text-white rounded-lg font-semibold hover:bg-[#84b1cb] duration-300 cursor-pointer">
                Приобрести
              </button>
            </div>
          </div>
          <div className="relative h-125 aspect-square rounded-2xl flex items-center justify-center">
             <Image src="/images/drone.png" alt="Дрон" fill className="object-contain" />
          </div>
        </div>
      </section>

      {/* <section id="teachers" className="py-20 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">Команда инструкторов</h2>
          <div className="flex overflow-x-auto pb-8 gap-6 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
            {loading ? <div className="w-full text-center py-10">Загрузка...</div> : teachers.map((teacher) => {
              const isTeacher = currentUserRole === Role.TEACHER;
              return (
                <div key={teacher.id} className="min-w-[280px] snap-center bg-white border border-[#a7c2d3]/30 rounded-xl p-6 flex flex-col items-center text-center shadow-sm">
                  <div className="w-20 h-20 rounded-full bg-[#a7c2d3]/20 flex items-center justify-center text-2xl font-bold mb-4">
                    {teacher.fullname.charAt(0)}
                  </div>
                  <Link href={`/profile/${teacher.id}`}><h3 className="font-bold text-lg hover:opacity-80 duration-200">{teacher.fullname}</h3></Link>
                  <p className="text-sm text-[#364954]/70 line-clamp-3 my-4">{teacher.bio || "Опытный инструктор."}</p>
                  
                  {!isTeacher && (!user?.teacherId || user.teacherId === null) && (
                    <button onClick={() => openConfirmModal(teacher.id)} className="w-full py-2 bg-[#364954] text-white rounded-lg hover:bg-[#84b1cb]">
                      Записаться
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section> */}
      
      <section id="teachers" className="py-20 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">Партнёры</h2>
          <div className="flex overflow-x-auto pb-8 gap-6 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
            
            
                <div className="w-70 snap-center rounded-xl p-6 flex flex-col items-center justify-center text-center gap-4">
                  <img src="/images/kvantorium.png" alt="Кванториум" className="w-full" />
                  <p className="text-xl font-semibold">Кванториум</p>
                </div>
                <div className="w-70 snap-center rounded-xl p-6 flex flex-col items-center justify-center text-center gap-4">
                  <img src="/images/lgtu.png" alt="ЛГТУ" className="w-full" />
                  <p className="text-xl font-semibold">Липецкий государственный технический университет</p>
                </div>
                <div className="w-70 snap-center rounded-xl p-6 flex flex-col items-center justify-center text-center gap-4">
                  <img src="/images/iro.png" alt="ИРО" className="w-full" />
                  <p className="text-xl font-semibold">Институт развития образования</p>
                </div>
                <div className="w-70 snap-center rounded-xl p-6 flex flex-col items-center justify-center text-center gap-4">
                  <img src="/images/mai.png" alt="МАИ" className="w-full" />
                  <p className="text-xl font-semibold">Московский авиационный институт</p>
                </div>
                
          </div>
        </div>
      </section>

      <section id="faq" className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-10 text-center">Частые вопросы</h2>
          <div className="space-y-4">
            {faqData.map((item, index) => (
              <details key={index} className="group bg-white border border-[#a7c2d3]/20 rounded-lg">
                <summary className="flex justify-between items-center font-medium cursor-pointer p-6 list-none">
                  <span>{item.question}</span>
                  <span className="transition group-open:rotate-180">▼</span>
                </summary>
                <div className="px-6 pb-6 text-[#364954]/70">{item.answer}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-[#364954] text-white">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* О нас */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#84b1cb]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          EDrone
        </h3>
        <p className="text-[#a7c2d3] text-sm leading-relaxed">
          Онлайн тренажер управления FPV-дроном.
        </p>
      </div>

      {/* Контакты */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#84b1cb]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Контакты
        </h3>
        <ul className="space-y-2 text-sm">
          <li>
            <a 
              href="mailto:Vadimbureev380@yandex.ru"
              className="text-[#a7c2d3] hover:text-white transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Vadimbureev380@yandex.ru
            </a>
          </li>
          <li>
            <a 
              href="mailto:krainovvova11@gmail.com"
              className="text-[#a7c2d3] hover:text-white transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              krainovvova11@gmail.com
            </a>
          </li>
          <li>
            <a 
              href="mailto:grigorijbatisev739@gmail.com"
              className="text-[#a7c2d3] hover:text-white transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              grigorijbatisev739@gmail.com
            </a>
          </li>
          <li>
            <a 
              href="mailto:FDA-2011@yandex.ru"
              className="text-[#a7c2d3] hover:text-white transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              FDA-2011@yandex.ru
            </a>
          </li>
        </ul>
      </div>

      {/* Адрес */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#84b1cb]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Адрес
        </h3>
        <address className="not-italic text-[#a7c2d3] text-sm leading-relaxed">
          <p className="flex items-start gap-2">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            г. Липецк, ул. Космонавтов, 20/3
          </p>
        </address>
        
        {/* Социальные сети (опционально) */}
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-3">Мы в соцсетях</h4>
          <div className="flex gap-3">
            <a 
              href="#" 
              className="w-8 h-8 bg-[#a7c2d3]/20 rounded-full flex items-center justify-center hover:bg-[#84b1cb] transition-colors"
              aria-label="Telegram"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </a>
            <a 
              href="#" 
              className="w-8 h-8 bg-[#a7c2d3]/20 rounded-full flex items-center justify-center hover:bg-[#84b1cb] transition-colors"
              aria-label="VK"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4-3-9s1.34-9 3-9" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>

    {/* Нижняя полоса с копирайтом */}
    <div className="border-t border-[#a7c2d3]/20 mt-8 pt-8 text-center">
      <p className="text-[#a7c2d3] text-sm">© 2026 EDrone School. Все права защищены.</p>
      <p className="text-[#a7c2d3]/60 text-xs mt-1">
        Образовательный центр по подготовке операторов БПЛА
      </p>
    </div>
  </div>
</footer>
    </div>
  );
}