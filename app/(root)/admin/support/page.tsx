"use client";

import { useEffect, useState } from "react";

interface Ticket {
  id: string;
  topic: string;
  description: string;
  answer: string | null;
  status: string;
  createdAt: string;
  user: { fullname: string; email: string };
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [answerText, setAnswerText] = useState("");

  useEffect(() => {
    fetch("/api/support")
      .then((res) => res.json())
      .then((data) => setTickets(data.tickets));
  }, []);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    try {
      const res = await fetch(`/api/support/${selectedTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: answerText }),
      });

      if (res.ok) {
        // Обновляем локально список
        setTickets(prev => prev.map(t => 
          t.id === selectedTicket.id ? { ...t, answer: answerText, status: "CLOSED" } : t
        ));
        setSelectedTicket(null);
        setAnswerText("");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Список тикетов */}
      <div className="lg:col-span-1 space-y-3">
        <h2 className="text-xl font-bold text-[#364954] mb-4">Все обращения</h2>
        {tickets.map((t) => (
          <div 
            key={t.id}
            onClick={() => { setSelectedTicket(t); setAnswerText(t.answer || ""); }}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              selectedTicket?.id === t.id 
                ? "border-[#84b1cb] bg-[#84b1cb]/10" 
                : "border-[#a7c2d3]/20 bg-white hover:border-[#84b1cb]"
            }`}
          >
            <div className="flex justify-between">
              <span className="font-semibold text-sm text-[#364954] truncate">{t.topic}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                t.status === "OPEN" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
              }`}>
                {t.status}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{t.user.fullname}</p>
          </div>
        ))}
      </div>

      {/* Детали и ответ */}
      <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-[#a7c2d3]/30 shadow-sm h-fit">
        {selectedTicket ? (
          <>
            <div className="border-b border-gray-100 pb-4 mb-4">
              <h2 className="text-2xl font-bold text-[#364954]">{selectedTicket.topic}</h2>
              <p className="text-sm text-gray-500 mt-1">
                От: {selectedTicket.user.fullname} ({selectedTicket.user.email})
              </p>
              <p className="text-sm text-gray-400">
                {new Date(selectedTicket.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6 text-[#364954] whitespace-pre-wrap">
              {selectedTicket.description}
            </div>

            <form onSubmit={handleReply}>
              <label className="block text-sm font-bold text-[#364954] mb-2">
                Ваш ответ:
              </label>
              <textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                rows={6}
                className="w-full p-3 border border-[#a7c2d3]/30 rounded-lg focus:ring-2 focus:ring-[#84b1cb] outline-none mb-4"
                placeholder="Напишите ответ пользователю..."
                required
              />
              <button 
                type="submit"
                className="px-6 py-2 bg-[#364954] text-white rounded-lg hover:bg-[#84b1cb] transition-colors font-medium"
              >
                Отправить ответ и закрыть тикет
              </button>
            </form>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            Выберите обращение слева для просмотра
          </div>
        )}
      </div>
    </div>
  );
}