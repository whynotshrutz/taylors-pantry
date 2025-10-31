import { useEffect, useMemo, useState } from "react";
import { useMealsByIngredient } from "./hooks/useMeals";
import { useLocalStorage } from "./hooks/useLocalStorage";
import MealCard from "./components/MealCard";
import MealModal from "./components/MealModal";

// Quick Picks and Moods
const QUICK_PICKS = [
  {
    label: "One-pot",
    queries: ["stew", "soup", "chili", "casserole"],
  },
  {
    label: "Under 20 min",
    queries: ["salad", "sandwich", "toast", "omelet"],
  },
  {
    label: "High-protein",
    queries: ["chicken", "egg", "lentil", "fish"],
  },
  {
    label: "Vegetarian",
    queries: ["paneer", "tofu", "vegetable", "spinach"],
  },
  {
    label: "Comfort bowls",
    queries: ["curry", "pasta", "ramen", "stew"],
  },
  {
    label: "Noodles/Pasta",
    queries: ["noodle", "spaghetti", "macaroni", "lasagna"],
  },
];


const MOODS = [
  {
    label: "Comfort",
    queries: ["curry", "pasta", "stew", "soup"],
  },
  {
    label: "Quick Bite",
    queries: ["sandwich", "wrap", "salad"],
  },
  {
    label: "Healthy",
    queries: ["grilled", "salad", "vegetable", "chicken"],
  },
  {
    label: "Indulgent",
    queries: ["cheese", "chocolate", "butter"],
  },
  {
    label: "Spicy",
    queries: ["chili", "pepper", "curry"],
  },
  {
    label: "Sweet",
    queries: [ "cake", "pudding"],
  },
];


// Fetch one random meal (Chef’s Choice)
async function openChefsChoice(setOpenId: (id: string) => void) {
  const r = await fetch("https://www.themealdb.com/api/json/v1/1/random.php");
  const j = await r.json();
  const id = j?.meals?.[0]?.idMeal;
  if (id) setOpenId(id);
}

type FavoriteMap = Record<string, true>;

export default function App() {
  // Welcome screen toggle
  const [started, setStarted] = useState(false);

  // Persisted states
  const [hasVisited, setHasVisited] = useLocalStorage<boolean>("tp.hasVisited", false);
  const [ingredient, setIngredient] = useLocalStorage<string>("tp.lastIngredient", "");
  const [favorites, setFavorites] = useLocalStorage<FavoriteMap>("tp.favorites", {});
  const [history, setHistory] = useLocalStorage<string[]>("tp.history", []);

  // Meal data
  const { data, loading, error } = useMealsByIngredient(ingredient);
  const [openId, setOpenId] = useState<string | null>(null);

  // Random recipes (first visit)
  const [initialRandomMeals, setInitialRandomMeals] = useState<any[]>([]);
  const [fetchingRandom, setFetchingRandom] = useState(false);

  // Generate a random unique input name to stop autocomplete
  function useRandomInputName() {
    const [n] = useState(() => `q_${Math.random().toString(36).slice(2)}`);
    return n;
  }
  const randomName = useRandomInputName();

  // Update search history
  useEffect(() => {
    if (!ingredient || loading) return;
    setHistory((prev) => {
      const next = [ingredient, ...prev.filter((x) => x !== ingredient)];
      return next.slice(0, 5);
    });
  }, [ingredient, loading, setHistory]);

  const meals = useMemo(() => data ?? [], [data]);
  const favMeals = useMemo(() => meals.filter((m) => favorites[m.idMeal]), [meals, favorites]);

  // Escape key closes modal
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenId(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Favorites toggle
  const toggleFav = (id: string) => {
    setFavorites((prev) => {
      const copy = { ...prev };
      if (copy[id]) delete copy[id];
      else copy[id] = true;
      return copy;
    });
  };

  // Fetch random recipes for first visit only
  async function fetchRandomMeals(count = 6) {
    setFetchingRandom(true);
    try {
      const calls = Array.from({ length: count }).map(() =>
        fetch("https://www.themealdb.com/api/json/v1/1/random.php").then((r) => r.json())
      );
      const results = await Promise.all(calls);
      const mealsList = results
        .map((j: any) => j?.meals?.[0])
        .filter(Boolean)
        .map((m) => ({
          idMeal: m.idMeal,
          strMeal: m.strMeal,
          strMealThumb: m.strMealThumb,
        }));
      setInitialRandomMeals(mealsList);
    } catch (e) {
      console.error("Random fetch failed", e);
      setInitialRandomMeals([]);
    } finally {
      setFetchingRandom(false);
    }
  }

  useEffect(() => {
    if (!started) return;
    if (!hasVisited) {
      fetchRandomMeals(6).then(() => setHasVisited(true));
    } else {
      setInitialRandomMeals([]);
    }
  }, [started]);

  const showInitialRandom = !hasVisited && initialRandomMeals.length > 0;

function applyMood(mood: { label: string; queries: string[] }) {
  const randomQuery =
    mood.queries[Math.floor(Math.random() * mood.queries.length)];
  setIngredient(randomQuery);
}
function applyQuickPick(pick: { label: string; queries: string[] }) {
  const randomQuery =
    pick.queries[Math.floor(Math.random() * pick.queries.length)];
  setIngredient(randomQuery);
}

  // -------- Welcome Screen --------
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

  // -------- Pantry UI --------
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white/70 backdrop-blur">
        <div className="container-app py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500 text-white font-semibold">
              TP
            </span>
            <div>
              <h1 className="text-xl font-semibold leading-tight">Taylor’s Pantry</h1>
              <p className="text-xs text-gray-500 -mt-0.5">Powered by TheMealDB</p>
            </div>
          </div>
        </div>
      </header>

      <section className="container-app mt-6">
        <div className="card p-5 sm:p-7">
          <div className="sm:flex sm:items-end sm:justify-between gap-4">
            <div className="sm:max-w-lg">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                What’s in the fridge tonight?
              </h2>
              <p className="text-gray-600 mt-1">
                Type ingredients or try a mood — results appear instantly.
              </p>
            </div>
            <button
              className="mt-3 sm:mt-0 inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium bg-sky-500 text-white border-sky-600 hover:bg-sky-600"
              onClick={() => openChefsChoice((id) => setOpenId(id))}
            >
              Chef’s Choice ✨
            </button>
          </div>

          {/* Disable all autocomplete behavior */}
          <form
            autoComplete="off"
            onSubmit={(e) => {
              e.preventDefault();
              if (ingredient.trim()) setIngredient(ingredient.trim());
            }}
            className="mt-4 flex gap-2"
          >
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-2.5 text-gray-400">🔎</span>
              <input
                type="search"
                className="input pl-9 pr-10"
                placeholder='Try "chicken", "paneer", "rice" or "biryani"'
                value={ingredient}
                onChange={(e) => setIngredient(e.target.value)}
                onFocus={(e) =>
                  ((e.target as HTMLInputElement).name = `q_${Math.random().toString(36).slice(2)}`)
                }
                aria-label="Ingredient input"
                name={randomName}
                autoComplete="off"
                spellCheck={false}
                inputMode="search"
              />
              {ingredient && (
                <button
                  type="button"
                  aria-label="Clear search"
                  className="absolute right-2 top-2 h-8 w-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
                  onClick={() => setIngredient("")}
                >
                  ✖
                </button>
              )}
            </div>
            <button className="btn-primary">Search</button>
          </form>

          {/* Mood chips */}
          <div className="mt-3 flex flex-wrap gap-2">
           {MOODS.map((m) => (
           <button key={m.label} className="chip" onClick={() => applyMood(m)}>
            {m.label}
            </button>
            ))}

          </div>

          {/* Quick Picks */}
          <div className="mt-3 flex flex-wrap gap-2">
            {QUICK_PICKS.map((q) => (
              <button key={q.label} className="chip" onClick={() => applyQuickPick(q)}>
                {q.label}
                </button>
             ))}

          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {history.map((h) => (
                <button key={h} className="chip" onClick={() => setIngredient(h)}>
                  {h}
                </button>
              ))}
              <button className="chip-muted" onClick={() => setHistory([])}>
                Clear
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Show random recipes on first visit */}
      {showInitialRandom && (
        <section className="container-app mt-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Welcome! Here are some random recipes to get started
          </h3>
          {fetchingRandom ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card overflow-hidden animate-pulse">
                  <div className="h-44 bg-gray-200" />
                  <div className="p-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="mt-2 h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {initialRandomMeals.map((m) => (
                <MealCard
                  key={m.idMeal}
                  idMeal={m.idMeal}
                  title={m.strMeal}
                  src={m.strMealThumb}
                  onClick={setOpenId}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Search results */}
      <section className="container-app mt-6 pb-16" aria-live="polite">
        {loading && <div className="text-center text-gray-500">Loading recipes...</div>}
        {error && <div className="text-red-600">Error: {error}</div>}

        {!loading && !error && ingredient && meals.length === 0 && (
          <div className="card p-6 text-gray-700">
            <div className="text-lg font-medium">
              No results for “{ingredient}”.
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Try one of these popular searches:
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {["chicken", "rice", "paneer", "egg"].map((s) => (
                <button key={s} className="chip" onClick={() => setIngredient(s)}>
                  {s}
                </button>
              ))}
            </div>
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

      <MealModal id={openId} onClose={() => setOpenId(null)} />

      <footer className="py-10 text-center text-xs text-gray-400">
        Bon appétit, Taylor 🍳
      </footer>
    </div>
  );
}
