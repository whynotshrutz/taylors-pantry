import { useEffect, useState } from "react";

export type MealSummary = {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
};

type MealsState = {
  data: MealSummary[] | null;
  loading: boolean;
  error: string | null;
  mode: "ingredients" | "name" | null; // which strategy returned results
};

const BASE = "https://www.themealdb.com/api/json/v1/1";

// Debounce helper
function useDebounced<T>(value: T, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function useMealsByIngredient(input: string) {
  const debounced = useDebounced(input.trim());
  const [state, setState] = useState<MealsState>({
    data: null,
    loading: false,
    error: null,
    mode: null,
  });

  useEffect(() => {
    if (!debounced) {
      setState({ data: null, loading: false, error: null, mode: null });
      return;
    }

    // Split input into potential ingredients (space or comma)
    const tokens = debounced
      .split(/[,\s]+/)
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean);

    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null, mode: null }));

    // 1) Ingredient fetches (one per token)
    const ingredientFetches = tokens.map((ing) =>
      fetch(`${BASE}/filter.php?i=${encodeURIComponent(ing)}`)
        .then((r) => r.json())
        .then((j) => (j.meals ?? []) as MealSummary[])
        .catch(() => [] as MealSummary[])
    );

    // 2) Name search (whole input as a dish name)
    const nameFetch = fetch(`${BASE}/search.php?s=${encodeURIComponent(debounced)}`)
      .then((r) => r.json())
      .then((j) => {
        const meals = (j.meals ?? []) as any[];
        // Map detail objects down to MealSummary shape
        return meals.map((m) => ({
          idMeal: m.idMeal,
          strMeal: m.strMeal,
          strMealThumb: m.strMealThumb,
        })) as MealSummary[];
      })
      .catch(() => [] as MealSummary[]);

    Promise.all([Promise.all(ingredientFetches), nameFetch]).then(([lists, nameList]) => {
      if (cancelled) return;

      // If no tokens, just use name search
      if (tokens.length === 0) {
        setState({ data: nameList, loading: false, error: null, mode: "name" });
        return;
      }

      // Intersect ingredient lists by idMeal
      const intersect = lists.length
        ? lists.reduce((acc, curr) => {
            if (acc === null) return curr;
            const ids = new Set(curr.map((m) => m.idMeal));
            return acc.filter((m) => ids.has(m.idMeal));
          }, null as MealSummary[] | null) ?? []
        : [];

      // Prefer ingredient intersection when it returns something.
      if (intersect.length > 0) {
        setState({ data: intersect, loading: false, error: null, mode: "ingredients" });
      } else {
        // Fallback to name search (handles queries like "biryani", "lasagna", etc.)
        setState({ data: nameList, loading: false, error: null, mode: "name" });
      }
    }).catch((err) => {
      if (!cancelled) setState({ data: null, loading: false, error: err.message, mode: null });
    });

    return () => {
      cancelled = true;
    };
  }, [debounced]);

  return state;
}
