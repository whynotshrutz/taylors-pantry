type MealCardProps = {
  idMeal: string;
  title: string;
  src: string;
  onClick?: (id: string) => void;
  isFav?: boolean;
  onToggleFav?: (id: string) => void;
};

export default function MealCard({
  idMeal,
  title,
  src,
  onClick,
  isFav = false,
  onToggleFav,
}: MealCardProps) {
  return (
    <div className="rounded-xl border bg-white overflow-hidden shadow-sm hover:shadow transition">
      <div className="relative">
        <img
          src={src}
          alt={title}
          className="w-full h-44 object-cover"
          loading="lazy"
        />
        <button
          className={`absolute top-2 right-2 rounded-full border bg-white/90 px-2 py-1 text-sm hover:bg-white ${
            isFav ? "text-red-600 border-red-200" : "text-gray-600"
          }`}
          onClick={(e) => { e.stopPropagation(); onToggleFav?.(idMeal); }}
          aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
          title={isFav ? "Unfavorite" : "Favorite"}
        >
          {isFav ? "♥" : "♡"}
        </button>
      </div>

      <button
        className="w-full text-left p-3"
        onClick={() => onClick?.(idMeal)}
        aria-label={`Open ${title}`}
      >
        <div className="font-medium line-clamp-2">{title}</div>
        <div className="mt-1 text-xs text-gray-500">Tap to see ingredients & steps</div>
      </button>
    </div>
  );
}
