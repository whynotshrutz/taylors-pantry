import { useEffect, useMemo, useState } from "react";
import { useMealsByIngredient } from "./hooks/useMeals";
import { useLocalStorage } from "./hooks/useLocalStorage";
import MealCard from "./components/MealCard";
import MealModal from "./components/MealModal";

/* ---------- quick picks ---------- */
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

/* ---------- mood map (simple) ---------- */
/* You can expand these to multi-word queries or pairings later */
const MOODS: { label: string; query: string }[] = [
  { label: "Comfort", query: "curry" },
  { label: "Quick Bite", query: "salad" },
  { label: "Healthy", query: "grilled" },
  { label: "Indulgent", query: "cheese" },
  { label: "Spicy", query: "curry" },
  { label: "Sweet", query: "dessert" },
];

type FavoriteMap = Record<string, true>;

export default function App() {
  // onboarding / first-run
  const [hasVisited, setHasVisited] = useLocalStorage<boolean>("tp.hasVisited", false);

  // persisted app state
  const [ingredient, setIngredient] = useLocalStorage<string>("tp.lastIngredient", "");
  const [favorites, setFavorites] = useLocalStorage<FavoriteMap>("tp.favorites", {});
  const [history, setHistory] = useLocalStorage<string[]>("tp.history", []);

  // hook-based data
  const { data, loading, error, mode } = useMealsByIngredient(ingredient);

  // modal + UI
  const [openId, setOpenId] = useState<string | null>(null);

  // *initialRandomMeals* shown only on first visit
  const [initialRandomMeals, setInitialRandomMeals] = useState<any[]>([]);
  const [fetchingRandom, setFetchingRandom] = useState(false);

  // fetch favorites list derived from known meals if needed
  const meals = useMemo(() => data ?? [], [data]);

  const favMeals = useMemo(
    () => (meals ? meals.filter((m) => favorites[m.idMeal]) : []),
    [meals, favorites]
  );

  useEffect(() => {
    // update history when a new search completes
    if (!ingredient || loading) return;
    setHistory((prev) => {
      const next = [ingredient, ...prev.filter((x) => x !== ingredient)];
      return next.slice(0, 5);
    });
  }, [ingredient, loading, setHistory]);

  const toggleFav = (id: string) => {
    setFavorites((prev) => {
      const copy = { ...prev };
      if (copy[id]) delete copy[id];
      else copy[id] = true;
      return copy;
    });
  };

  /* ---------- first run: fetch multiple random meals ---------- */
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
    // On first load, if user hasn't visited before, fetch random recipes
    if (!hasVisited) {
      fetchRandomMeals(6).then(() => {
        // mark visited so we don't fetch random again on subsequent loads
        setHasVisited(true);
      });
    } else {
      // clear initialRandomMeals if it's a repeat visit
      setInitialRandomMeals([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  /* ---------- mood handler ---------- */
  function applyMood(moodQuery: string) {
    // set ingredient to mood query and trigger hook (debounced inside hook)
    setIngredient(moodQuery);
  }

  /* ---------- UI helpers ---------- */
  const showInitialRandom = !hasVisited && initialRandomMeals.length > 0;
  // note: after first render, hasVisited is set true (so next load shows favorites)

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
              <h1 className="text-xl font-semibold leading-tight">Taylor’s Pantry</h1>
              <p className="text-xs text-gray-500 -mt-0.5">Powered by TheMealDB</p>
            </div>
          </div>
        </div>
      </header>

      {/* Intro / search card */}
      <section className="container-app mt-6">
        <div className="card p-5 sm:p-7">
          <div className="sm:flex sm:items-end sm:justify-between gap-4">
            <div className="sm:max-w-lg">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                What’s in the fridge tonight?
              </h2>
              <p className="text-gray-600 mt-1">
                Type ingredient(s) (space/comma separated) or a dish name. Try mood chips if you want inspiration.
              </p>
            </div>

            <button
              className="mt-3 sm:mt-0 inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium bg-sky-500 text-white border-sky-600 hover:bg-sky-600"
              onClick={() => openChefsChoice((id) => setOpenId(id))}
            >
              Chef’s Choice ✨
            </button>
          </div>

          {/* input */}
          <div className="mt-4 flex gap-2">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-2.5 text-gray-400">🔎</span>
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
                name="pantry_q"
              />
            </div>
            <button
              className="btn-primary"
              onClick={() => { if (ingredient.trim()) setIngredient(ingredient.trim()); }}
            >
              Search
            </button>
          </div>

          {/* Mood chips */}
          <div className="mt-3 flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <button
                key={m.label}
                className="chip"
                onClick={() => applyMood(m.query)}
                aria-label={`Mood ${m.label}`}
                title={m.label}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Quick picks */}
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

          {/* Recent searches */}
          {history.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {history.map((h) => (
                <button key={h} className="chip" onClick={() => setIngredient(h)} aria-label={`Use ${h}`}>
                  {h}
                </button>
              ))}
              <button className="chip-muted" onClick={() => setHistory([])} aria-label="Clear history">
                Clear
              </button>
            </div>
          )}
        </div>
      </section>

      {/* IF first-time show random picks */}
      {showInitialRandom && (
        <section className="container-app mt-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Welcome! Here are some recipes to get started</h3>
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

      {/* If not first-run: Favorites (already from your logic) */}
      {!showInitialRandom && Object.keys(favorites).length > 0 && (
        <section className="container-app mt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">Favorites</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {/* favorites: for simplicity show favorite items by fetching their ids via MealDB if needed.
                Here we show favorites only when they overlap with current 'meals' or initialRandomMeals.
                For a full solution you could fetch details for each favorite id on mount */}
            {Object.keys(favorites).slice(0, 8).map((id) => (
              // Attempt to find title & thumb from current sets first
              (() => {
                const found =
                  (meals ?? []).find((x: any) => x.idMeal === id) ||
                  initialRandomMeals.find((x: any) => x.idMeal === id);
                if (found) {
                  return (
                    <MealCard
                      key={id}
                      idMeal={id}
                      title={found.strMeal}
                      src={found.strMealThumb}
                      isFav
                      onToggleFav={toggleFav}
                      onClick={setOpenId}
                    />
                  );
                }
                // fallback: render a minimal placeholder and load detail on click (open modal by id)
                return (
                  <div key={id} className="card p-3">
                    <div className="font-medium">Saved recipe</div>
                    <div className="text-xs text-gray-500 mt-1">Click to open</div>
                    <div className="mt-3">
                      <button
                        className="btn-ghost"
                        onClick={() => setOpenId(id)}
                      >
                        Open
                      </button>
                    </div>
                  </div>
                );
              })()
            ))}
          </div>
        </section>
      )}

      {/* Results (normal search results or fallback messages) */}
      <section className="container-app mt-6 pb-16" aria-live="polite">
        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card overflow-hidden animate-pulse">
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
          <div className="card p-4 border-red-200 bg-red-50 text-red-700">Network issue: {error}</div>
        )}

        {/* If the user has typed a query and there are no results */}
        {!loading && !error && ingredient && meals.length === 0 && (
          <div className="card p-6 text-gray-700">
            <div className="text-lg font-medium">No results for “{ingredient}”.</div>
            <div className="text-sm text-gray-500 mt-1">
              Try a single ingredient, different spelling, or a dish name.
            </div>
          </div>
        )}

        {/* show note when search returned dish-name matches */}
        {!loading && !error && ingredient && mode === "name" && (data?.length ?? 0) > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            Showing dish name matches for “{ingredient}”. Try “chicken rice” to filter by ingredients.
          </div>
        )}

        {/* empty prompt when no ingredient typed and not first-run */}
        {!ingredient && !showInitialRandom && Object.keys(favorites).length === 0 && (
          <div className="card p-6 text-gray-600">
            Start by typing an ingredient or a dish—Taylor just walked in with something from the fridge.
          </div>
        )}

        {/* normal results grid */}
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mt-4">
          {meals.map((m: any) => (
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

      <footer className="py-10 text-center text-xs text-gray-400">Bon appétit, Taylor 🍳</footer>
    </div>
  );
}
