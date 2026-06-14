"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
  Area,
} from "recharts";

interface GameData {
  id: string;
  gameNumber: number;
  challenge1: number;
  challenge2: number;
  challenge3: number;
  challenge4: number;
  score: number;
  time: number;
  date: string;
}

interface GameAnalytics {
  totalGames: number;
  averageScore: number;
  averageTime: number;
  bestScore: number;
  bestTime: number;
  worstScore: number;
  worstTime: number;
  challengeAverages: {
    challenge1: number;
    challenge2: number;
    challenge3: number;
    challenge4: number;
  };
  challengeBest: {
    challenge1: number;
    challenge2: number;
    challenge3: number;
    challenge4: number;
  };
  allGames: GameData[];
  userName?: string;
}

export default function GameProgressChart({ userId }: { userId: string }) {
  const [analytics, setAnalytics] = useState<GameAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChart, setSelectedChart] = useState<"progress" | "details">("progress");
  const [sortOrder, setSortOrder] = useState<string>("date-asc");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Безопасная функция для форматирования чисел
  const safeToFixed = (value: any, digits: number = 1): string => {
    if (value === undefined || value === null || isNaN(Number(value))) {
      return "0";
    }
    return Number(value).toFixed(digits);
  };

  // Безопасное получение числа
  const safeNumber = (value: any): number => {
    if (value === undefined || value === null || isNaN(Number(value))) {
      return 0;
    }
    return Number(value);
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/gameround/${userId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Ошибка загрузки данных");
        }
        
        const data = await response.json();
        
        // Санитизация данных - преобразуем все значения в числа
        if (data && data.allGames) {
          const sanitizedData: GameAnalytics = {
            totalGames: safeNumber(data.totalGames),
            averageScore: safeNumber(data.averageScore),
            averageTime: safeNumber(data.averageTime),
            bestScore: safeNumber(data.bestScore),
            bestTime: safeNumber(data.bestTime),
            worstScore: safeNumber(data.worstScore),
            worstTime: safeNumber(data.worstTime),
            challengeAverages: {
              challenge1: safeNumber(data.challengeAverages?.challenge1),
              challenge2: safeNumber(data.challengeAverages?.challenge2),
              challenge3: safeNumber(data.challengeAverages?.challenge3),
              challenge4: safeNumber(data.challengeAverages?.challenge4),
            },
            challengeBest: {
              challenge1: safeNumber(data.challengeBest?.challenge1),
              challenge2: safeNumber(data.challengeBest?.challenge2),
              challenge3: safeNumber(data.challengeBest?.challenge3),
              challenge4: safeNumber(data.challengeBest?.challenge4),
            },
            allGames: data.allGames.map((game: any) => ({
              id: game.id || '',
              gameNumber: safeNumber(game.gameNumber),
              challenge1: safeNumber(game.challenge1),
              challenge2: safeNumber(game.challenge2),
              challenge3: safeNumber(game.challenge3),
              challenge4: safeNumber(game.challenge4),
              score: safeNumber(game.score),
              time: safeNumber(game.time),
              date: game.date || new Date().toISOString(),
            })),
            userName: data.userName,
          };
          setAnalytics(sanitizedData);
        } else {
          setAnalytics(null);
        }
      } catch (error) {
        console.error("Error fetching game stats:", error);
        setError(error instanceof Error ? error.message : "Неизвестная ошибка");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchStats();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="text-center py-8" role="status" aria-label="Загрузка статистики">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto"></div>
        <p className="mt-4 text-gray-600">Загрузка статистики...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500 bg-red-50 rounded-lg" role="alert">
        <p className="text-lg font-medium">Ошибка загрузки</p>
        <p className="text-sm mt-2">{error}</p>
      </div>
    );
  }

  if (!analytics || analytics.totalGames === 0 || !analytics.allGames || analytics.allGames.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 bg-white rounded-lg" role="status">
        <p className="text-lg font-medium">Нет данных об играх</p>
        <p className="text-sm mt-2">Статистика появится после первой игры</p>
      </div>
    );
  }

  let filteredGames = [...analytics.allGames].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  if (searchTerm) {
    filteredGames = filteredGames.filter(game => 
      game.gameNumber.toString().includes(searchTerm) ||
      game.score.toString().includes(searchTerm)
    );
  }

  switch (sortOrder) {
    case "date-desc":
      filteredGames.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      break;
    case "date-asc":
      filteredGames.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      break;
    case "score-desc":
      filteredGames.sort((a, b) => b.score - a.score);
      break;
    case "score-asc":
      filteredGames.sort((a, b) => a.score - b.score);
      break;
    case "time-asc":
      filteredGames.sort((a, b) => a.time - b.time);
      break;
    case "time-desc":
      filteredGames.sort((a, b) => b.time - a.time);
      break;
  }

  const colors = {
    challenge1: "#3b82f6",
    challenge2: "#10b981",
    challenge3: "#f59e0b",
    challenge4: "#ef4444",
    score: "#8b5cf6",
    time: "#f97316",
  };

  const chartTypes = [
    { key: "progress" as const, label: "Прогресс", desc: "Общий балл и время" },
    { key: "details" as const, label: "Детализация", desc: "Результаты по испытаниям" },
  ];

  return (
    <div className="space-y-6">
      {/* Имя пользователя */}
      {analytics.userName && (
        <div className="text-sm text-gray-500">
          Статистика игрока: <span className="font-medium">{analytics.userName}</span>
        </div>
      )}

      {/* Статистические карточки */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="text-sm text-blue-600 font-medium">Всего игр</div>
          <div className="text-3xl font-bold text-blue-800">{analytics.totalGames}</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="text-sm text-green-600 font-medium">Средний балл</div>
          <div className="text-3xl font-bold text-green-800">
            {safeToFixed(analytics.averageScore)}
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="text-sm text-purple-600 font-medium">Лучший результат</div>
          <div className="text-3xl font-bold text-purple-800">{safeToFixed(analytics.bestScore)}</div>
          <div className="text-xs text-purple-600 mt-1">
            Худший: {safeToFixed(analytics.worstScore)}
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
          <div className="text-sm text-orange-600 font-medium">Лучшее время</div>
          <div className="text-3xl font-bold text-orange-800">
            {safeToFixed(analytics.bestTime)}с
          </div>
          <div className="text-xs text-orange-600 mt-1">
            Среднее: {safeToFixed(analytics.averageTime)}с
          </div>
        </div>
      </div>

      {/* Дополнительная статистика по испытаниям */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(analytics.challengeBest).map(([challenge, value]) => (
          <div key={challenge} className="bg-white rounded-lg p-3 border">
            <div className="text-xs text-gray-600">
              {challenge.replace('challenge', 'Испытание ')}
            </div>
            <div className="text-lg font-bold">{safeToFixed(value)}</div>
            <div className="text-xs text-gray-500">
              Среднее: {safeToFixed(analytics.challengeAverages[challenge as keyof typeof analytics.challengeAverages])}
            </div>
          </div>
        ))}
      </div>

      {/* Переключатель графиков */}
      <div className="flex flex-wrap gap-2">
        {chartTypes.map(({ key, label, desc }) => (
          <button
            key={key}
            type="button"
            onClick={() => setSelectedChart(key)}
            className={`px-4 py-2 rounded-lg transition-colors text-left ${
              selectedChart === key
                ? "bg-gray-800 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100 border"
            }`}
            title={desc}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Графики */}
      <div className="bg-white rounded-lg p-6 shadow-lg border">
        <h3 className="text-lg font-semibold mb-4">
          {selectedChart === "progress" && "Прогресс результатов по всем играм"}
          {selectedChart === "details" && "Детализация по испытаниям"}
        </h3>

        <div role="img" aria-label={`График ${selectedChart}`}>
          <ResponsiveContainer width="100%" height={500}>
            {selectedChart === "progress" && (
              <ComposedChart data={filteredGames}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="gameNumber" 
                  label={{ value: "Номер игры", position: "bottom" }}
                  reversed={false}
                />
                <YAxis yAxisId="left" label={{ value: "Баллы", angle: -90, position: "insideLeft" }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: "Время (с)", angle: 90, position: "insideRight" }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0]?.payload;
                      if (!data) return null;
                      return (
                        <div className="bg-white p-4 border rounded-lg shadow-lg">
                          <p className="font-bold text-lg">Игра #{data.gameNumber}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(data.date).toLocaleString("ru-RU")}
                          </p>
                          <div className="mt-2 space-y-1">
                            <p className="text-purple-600">Баллы: {safeToFixed(data.score)}</p>
                            <p className="text-orange-600">Время: {safeToFixed(data.time)}с</p>
                            <p className="text-blue-600">Исп.1: {safeToFixed(data.challenge1)}</p>
                            <p className="text-green-600">Исп.2: {safeToFixed(data.challenge2)}</p>
                            <p className="text-yellow-600">Исп.3: {safeToFixed(data.challenge3)}</p>
                            <p className="text-red-600">Исп.4: {safeToFixed(data.challenge4)}</p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="score" fill={colors.score} stroke={colors.score} fillOpacity={0.1} name="Баллы" />
                <Line yAxisId="left" type="monotone" dataKey="score" stroke={colors.score} strokeWidth={2} dot={{ r: 3 }} name="Баллы" />
                <Line yAxisId="right" type="monotone" dataKey="time" stroke={colors.time} strokeWidth={2} dot={{ r: 3 }} name="Время" />
              </ComposedChart>
            )}

            {selectedChart === "details" && (
              <BarChart data={filteredGames}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="gameNumber" label={{ value: "Номер игры", position: "bottom" }} />
                <YAxis label={{ value: "Баллы", angle: -90, position: "insideLeft" }} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0]?.payload;
                      if (!data) return null;
                      return (
                        <div className="bg-white p-4 border rounded-lg shadow-lg">
                          <p className="font-bold text-lg">Игра #{data.gameNumber}</p>
                          <div className="mt-2 space-y-1">
                            <p className="text-blue-600">Исп.1: {safeToFixed(data.challenge1)}</p>
                            <p className="text-green-600">Исп.2: {safeToFixed(data.challenge2)}</p>
                            <p className="text-yellow-600">Исп.3: {safeToFixed(data.challenge3)}</p>
                            <p className="text-red-600">Исп.4: {safeToFixed(data.challenge4)}</p>
                            <p className="border-t pt-1 mt-1 font-bold text-purple-600">Всего: {safeToFixed(data.score)}</p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar dataKey="challenge1" stackId="a" fill={colors.challenge1} name="Испытание 1" radius={[0, 0, 0, 0]} />
                <Bar dataKey="challenge2" stackId="a" fill={colors.challenge2} name="Испытание 2" radius={[0, 0, 0, 0]} />
                <Bar dataKey="challenge3" stackId="a" fill={colors.challenge3} name="Испытание 3" radius={[0, 0, 0, 0]} />
                <Bar dataKey="challenge4" stackId="a" fill={colors.challenge4} name="Испытание 4" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Таблица */}
      <div className="bg-white rounded-lg p-6 shadow-lg border">
        <h3 className="text-lg font-semibold mb-4">
          Все игры ({analytics.totalGames})
        </h3>
        
        <div className="mb-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <label htmlFor="game-search" className="sr-only">Поиск по номеру игры или баллам</label>
            <input
              id="game-search"
              type="text"
              placeholder="Поиск по номеру игры или баллам..."
              className="w-full px-3 py-2 border rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <label htmlFor="sort-order" className="sr-only">Сортировка игр</label>
            <select 
              id="sort-order"
              className="px-3 py-2 border rounded-lg bg-white"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              title="Порядок сортировки игр"
            >
              <option value="date-asc">Сначала старые</option>
              <option value="date-desc">Сначала новые</option>
              <option value="score-desc">По баллам (убывание)</option>
              <option value="score-asc">По баллам (возрастание)</option>
              <option value="time-asc">По времени (возрастание)</option>
              <option value="time-desc">По времени (убывание)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto max-h-96 overflow-y-auto">
  <table className="w-full text-sm">
    <thead className="sticky top-0 bg-gray-50 z-10">
      <tr className="text-left text-gray-600">
        <th scope="col" className="pb-3 px-2">#</th>
        <th scope="col" className="pb-3 px-2">Дата</th>
        <th scope="col" className="pb-3 px-2">Исп. 1</th>
        <th scope="col" className="pb-3 px-2">Исп. 2</th>
        <th scope="col" className="pb-3 px-2">Исп. 3</th>
        <th scope="col" className="pb-3 px-2">Исп. 4</th>
        <th scope="col" className="pb-3 px-2">Общий балл</th>
        <th scope="col" className="pb-3 px-2">Время</th>
      </tr>
    </thead>
    <tbody>
      {filteredGames.map((game) => (
        <tr 
          key={game.id} 
          className={`border-t hover:bg-gray-50 transition-colors ${
            game.score === analytics.bestScore ? "bg-green-50" : ""
          } ${game.time === analytics.bestTime ? "bg-blue-50" : ""}`}
        >
          <td className="py-2 px-2 font-medium">{game.gameNumber}</td>
          <td className="py-2 px-2 whitespace-nowrap">
            {new Date(game.date).toLocaleDateString("ru-RU", {
              day: "2-digit",
              month: "2-digit",
              year: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </td>
          <td className="py-2 px-2">{safeToFixed(game.challenge1)}</td>
          <td className="py-2 px-2">{safeToFixed(game.challenge2)}</td>
          <td className="py-2 px-2">{safeToFixed(game.challenge3)}</td>
          <td className="py-2 px-2">{safeToFixed(game.challenge4)}</td>
          <td className="py-2 px-2">
            <span className={`font-bold ${
              game.score === analytics.bestScore ? "text-green-600" : ""
            }`}>
              {safeToFixed(game.score)}
              {game.score === analytics.bestScore && " (Рекорд)"}
            </span>
          </td>
          <td className="py-2 px-2">
            {safeToFixed(game.time)}с
            {game.time === analytics.bestTime && " (Лучшее)"}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
        
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Показано игр: {filteredGames.length} из {analytics.totalGames}
            {searchTerm && ` (отфильтровано)`}
          </p>
        </div>
      </div>

      {/* Экспорт */}
      <div className="flex flex-wrap gap-4">
        <button
          type="button"
          onClick={() => {
            const csv = [
              ["Номер", "Дата", "Исп.1", "Исп.2", "Исп.3", "Исп.4", "Баллы", "Время"].join(","),
              ...analytics.allGames.map(g => 
                [g.gameNumber, g.date, safeToFixed(g.challenge1), safeToFixed(g.challenge2), safeToFixed(g.challenge3), safeToFixed(g.challenge4), safeToFixed(g.score), safeToFixed(g.time)].join(",")
              )
            ].join("\n");
            
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `game-stats-${userId}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
          }}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          Экспорт в CSV
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          Печать
        </button>
      </div>
    </div>
  );
}