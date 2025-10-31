import { useEffect, useMemo, useState } from "react";
import { useMealsByIngredient } from "./hooks/useMeals";
import { useLocalStorage } from "./hooks/useLocalStorage";
import MealCard from "./components/MealCard";
import MealModal from "./components/MealModal";

// ----------------------
// Quick Picks + Random Fetch
// ----------------------
const QUICK_PICKS: { label: string; query: string }[] = [
  { label: "One-pot", query: "stew" },
  { label: "Under 20 min", query: "salad" },
  { label: "High-protein", query: "chicken" },
  { label: "Vegetarian", query: "paneer" },
  { label: "Comfort bowls", query: "curry" },
  { label: "Noodles/Pasta", query: "noodle" },
];

async function openChefsChoice(setOpenId: (id: string) => void) {
  const r = await fetch("https://www.themealdb.com/api/json/v1/1/random.php");
  const j = await r.json();
  const id = j?.meals?.[0]?.idMeal as string | undefined;
  if (id) setOpenId(id);
}

// ----------------------
// Component
// ----------------------
type FavoriteMap = Record<string, true>;

export default function App() {
  const [started, setStarted] = useState(false);

  const [ingredient, setIngredient] = useLocalStorage<string>(
    "tp.lastIngredient",
    ""
  );
  const [favorites, setFavorites] = useLocalStorage<FavoriteMap>(
    "tp.favorites",
    {}
  );
  const [history, setHistory] = useLocalStorage<string[]>("tp.history", []);

  const { data, loading, error, mode } = useMealsByIngredient(ingredient);
  const [openId, setOpenId] = useState<string | null>(null);

  // Store recent searches
  useEffect(() => {
    if (!ingredient || loading) return;
    setHistory((prev) => {
      const next = [ingredient, ...prev.filter((x) => x !== ingredient)];
      return next.slice(0, 5);
    });
  }, [ingredient, loading, setHistory]);

  // Favorites toggle
  const toggleFav = (id: string) => {
    setFavorites((prev) => {
      const copy = { ...prev };
      if (copy[id]) delete copy[id];
      else copy[id] = true;
      return copy;
    });
  };

  const meals = useMemo(() => data ?? [], [data]);
  const favMeals = useMemo(
    () => meals.filter((m) => favorites[m.idMeal]),
    [meals, favorites]
  );

  // ----------------------
  // 1. Landing / Intro Screen
  // ----------------------
  if (!started) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 to-blue-50">
        <div className="text-center max-w-md p-6 bg-white rounded-3xl shadow-lg border">
          <h1 className="text-3xl font-bold mb-2">Welcome to Taylor’s Pantry 👋</h1>
          <p className="text-gray-600 mb-6">
            Hungry? Let’s find something delicious you can cook right now.
          </p>

          <button
            onClick={() => setStarted(true)}
            className="rounded-xl px-6 py-3 text-lg font-medium bg-sky-500 hover:bg-sky-600 text-white shadow transition"
          >
            Let’s Get Started 🍳
          </button>

          <p className="text-xs text-gray-400 mt-6">
            You can search by any ingredient or dish name once inside.
          </p>
        </div>
      </div>
    );
  }

  // ----------------------
  // 2. Pantry UI
  // ----------------------
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-white/70 backdrop-blur">
        <div className="container-app py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500 text-white font-semibold">
              TP
            </span>
            <div>
              <h1 className="text-xl font-semibold leading-tight">
                Taylor’s Pantry
              </h1>
              <p className="text-xs text-gray-500 -mt-0.5">
                Powered by TheMealDB
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Search + Quick Picks */}
      <section className="container-app mt-6">
        <div className="card p-5 sm:p-7">
          <div className="sm:flex sm:items-end sm:justify-between gap-4">
            <div className="sm:max-w-lg">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                What’s in the fridge tonight?
              </h2>
              <p className="text-gray-600 mt-1">
                Type one or more ingredients (comma or space separated) or a dish name. Click a card for ingredients & steps.
              </p>
            </div>

            {/* Chef's Choice */}
            <button
              className="mt-3 sm:mt-0 inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium bg-sky-500 text-white border-sky-600 hover:bg-sky-600"
              onClick={() => openChefsChoice((id) => setOpenId(id))}
              aria-label="Chef's Choice"
              title="Chef's Choice"
            >
              Chef’s Choice ✨
            </button>
          </div>

          {/* Input */}
          <div className="mt-4 flex gap-2">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-2.5 text-gray-400">
                🔎
              </span>
              <input
                type="text"
                className="input pl-9"
                placeholder='Try "chicken", "paneer", "rice" or "biryani"'
                value={ingredient}
                onChange={(e) => setIngredient(e.target.value)}
                aria-label="Ingredient or dish input"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                name="pantry_q_42"
              />
            </div>
            <button
              className="btn-primary"
              onClick={() => {
                if (ingredient.trim()) setIngredient(ingredient.trim());
              }}
            >
              Search
            </button>
          </div>

          {/* Quick Picks */}
          <div className="mt-3 flex flex-wrap gap-2">
            {QUICK_PICKS.map((q) => (
              <button
                key={q.label}
                className="chip"
                onClick={() => setIngredient(q.query)}
                aria-label={`Use ${q.label}`}
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* Recent Searches */}
          {history.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {history.map((h) => (
                <button
                  key={h}
                  className="chip"
                  onClick={() => setIngredient(h)}
                  aria-label={`Use ${h}`}
                >
                  {h}
                </button>
              ))}
              <button
                className="chip-muted"
                onClick={() => setHistory([])}
                aria-label="Clear history"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Favorites */}
      {favMeals.length > 0 && (
        <section className="container-app mt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">Favorites</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {favMeals.map((m) => (
              <MealCard
                key={`fav-${m.idMeal}`}
                idMeal={m.idMeal}
                title={m.strMeal}
                src={m.strMealThumb}
                isFav
                onToggleFav={toggleFav}
                onClick={setOpenId}
              />
            ))}
          </div>
        </section>
      )}

      {/* Results */}
      <section className="container-app mt-6 pb-16" aria-live="polite">
        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="card overflow-hidden animate-pulse"
              >
                <div className="h-44 bg-gray-200" />
                <div className="p-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="mt-2 h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="card p-4 border-red-200 bg-red-50 text-red-700">
            Network issue: {error}
          </div>
        )}

        {!loading && !error && ingredient && meals.length === 0 && (
          <div className="card p-6 text-gray-700">
            <div className="text-lg font-medium">
              No results for “{ingredient}”.
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Try a single ingredient or a different spelling.
            </div>
          </div>
        )}

        {!ingredient && (
          <div className="card p-6 text-gray-600">
            Start by typing an ingredient—Taylor just walked in with something from the fridge.
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mt-4">
          {meals.map((m) => (
            <MealCard
              key={m.idMeal}
              idMeal={m.idMeal}
              title={m.strMeal}
              src={m.strMealThumb}
              isFav={!!favorites[m.idMeal]}
              onToggleFav={toggleFav}
              onClick={setOpenId}
            />
          ))}
        </div>
      </section>

      {/* Modal */}
      <MealModal id={openId} onClose={() => setOpenId(null)} />

      <footer className="py-10 text-center text-xs text-gray-400">
        Bon appétit, Taylor 🍳
      </footer>
    </div>
  );
}
