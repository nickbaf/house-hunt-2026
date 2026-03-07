import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number | null;
  onChange?: (rating: number) => void;
  size?: "sm" | "md";
}

export function RatingStars({ rating, onChange, size = "md" }: RatingStarsProps) {
  const starSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(rating === star ? 0 : star)}
          disabled={!onChange}
          className={cn(
            "transition-colors",
            onChange ? "cursor-pointer hover:text-amber-300" : "cursor-default",
          )}
        >
          <Star
            className={cn(
              starSize,
              rating !== null && star <= rating
                ? "fill-amber-400 text-amber-400"
                : "text-zinc-600",
            )}
          />
        </button>
      ))}
    </div>
  );
}
