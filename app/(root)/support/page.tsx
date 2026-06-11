"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SupportStatus } from "@prisma/client";

interface Ticket {
  id: string;
  topic: string;
  description: string;
  answer: string | null;
  status: SupportStatus;
  createdAt: string;
}

export default function SupportPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ topic: "", description: "" });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/support");
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        setFormData({ topic: "", description: "" });
        fetchTickets();
      } else {
        alert("Ошибка при отправке");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-[#364954] mb-8">Техническая поддержка</h1>

      {/* Форма создания */}
      <div className="bg-white p-6 rounded-xl border border-[#a7c2d3]/30 shadow-sm mb-10">
        <h2 className="text-xl font-semibold mb-4 text-[#364954]">Новое обращение</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Тема вопроса"
            value={formData.topic}
            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
            className="w-full p-3 border border-[#a7c2d3]/30 rounded-lg focus:ring-2 focus:ring-[#84b1cb] outline-none"
            required
          />
          <textarea
            placeholder="Опишите проблему подробно..."
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full p-3 border border-[#a7c2d3]/30 rounded-lg focus:ring-2 focus:ring-[#84b1cb] outline-none resize-none"
            required
          />
          <button 
            type="submit"
            className="px-6 py-2 bg-[#364954] text-white rounded-lg hover:bg-[#84b1cb] transition-colors font-medium"
          >
            Отправить
          </button>
        </form>
      </div>

      {/* История */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[#364954]">История обращений</h2>
        {loading ? (
          <p className="text-gray-500">Загрузка...</p>
        ) : tickets.length === 0 ? (
          <p className="text-gray-500 italic">У вас пока нет обращений.</p>
        ) : (
          tickets.map((ticket) => (
            <div key={ticket.id} className="bg-white p-5 rounded-xl border border-[#a7c2d3]/20 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-[#364954]">{ticket.topic}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  ticket.status === "OPEN" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
                }`}>
                  {ticket.status === "OPEN" ? "В работе" : "Отвечено"}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-4 whitespace-pre-wrap">{ticket.description}</p>
              
              {ticket.answer && (
                <div className="bg-[#f8fafc] p-4 rounded-lg border-l-4 border-[#84b1cb] mt-4">
                  <p className="text-xs text-[#364954]/60 font-bold uppercase mb-1">Ответ поддержки:</p>
                  <p className="text-[#364954]">{ticket.answer}</p>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-3 text-right">
                {new Date(ticket.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}