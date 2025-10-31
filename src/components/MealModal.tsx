import { useEffect, useState } from "react";

type MealDetail = {
  idMeal: string;
  strMeal: string | null;
  strCategory: string | null;
  strArea: string | null;
  strInstructions: string | null;
  strMealThumb: string | null;
  strYoutube: string | null;
  [k: string]: string | null;
};

async function fetchMealDetail(idMeal: string): Promise<MealDetail | null> {
  const r = await fetch(
    `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${encodeURIComponent(idMeal)}`
  );
  if (!r.ok) throw new Error(`Network error: ${r.status}`);
  const json = await r.json();
  return (json.meals?.[0] ?? null) as MealDetail | null;
}

export default function MealModal({ id, onClose }: { id: string | null; onClose: () => void }) {
  const [meal, setMeal] = useState<MealDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let stop = false;
    setLoading(true); setErr(null); setMeal(null);
    fetchMealDetail(id)
      .then((m) => !stop && setMeal(m))
      .catch((e) => !stop && setErr(e.message))
      .finally(() => !stop && setLoading(false));
    return () => { stop = true; };
  }, [id]);

  if (!id) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 grid place-items-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="max-w-2xl w-full rounded-xl bg-white p-4 sm:p-6 overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start gap-4">
          <h2 className="text-xl font-semibold">{meal?.strMeal ?? "Meal"}</h2>
          <button className="rounded-md border px-3 py-1" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {loading && <p className="mt-4">Loading details…</p>}
        {err && <p className="mt-4 text-red-600">Error: {err}</p>}

        {meal && (
          <>
            {meal.strMealThumb && (
              <img
                src={meal.strMealThumb}
                alt={meal.strMeal ?? ""}
                className="w-full h-64 object-cover rounded-lg mt-3"
              />
            )}

            <div className="mt-4 grid sm:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Category</div>
                <div>{meal.strCategory ?? "-"}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Cuisine</div>
                <div>{meal.strArea ?? "-"}</div>
              </div>
            </div>

            <h3 className="mt-6 font-semibold">Ingredients</h3>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {Array.from({ length: 20 }).map((_, i) => {
                const ing = meal[`strIngredient${i + 1}`];
                const meas = meal[`strMeasure${i + 1}`];
                if (!ing || !ing.trim()) return null;
                return <li key={i}>{`${ing}${meas ? ` – ${meas}` : ""}`}</li>;
              })}
            </ul>

            {meal.strInstructions && (
              <>
                <h3 className="mt-6 font-semibold">Instructions</h3>
                <p className="whitespace-pre-wrap mt-2">{meal.strInstructions}</p>
              </>
            )}

            {meal.strYoutube && (
              <a
                href={meal.strYoutube}
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-6 text-blue-600 underline"
              >
                Watch on YouTube
              </a>
            )}
          </>
        )}
      </div>
    </div>
  );
}
