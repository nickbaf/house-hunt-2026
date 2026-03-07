import { useState, useMemo } from "react";
import { Send, Trash2, User } from "lucide-react";
import type { Comment } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { formatRelativeTime } from "@/lib/utils";

const USER_COLORS = [
  { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30" },
  { bg: "bg-violet-500/20", text: "text-violet-400", border: "border-violet-500/30" },
  { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30" },
  { bg: "bg-sky-500/20", text: "text-sky-400", border: "border-sky-500/30" },
  { bg: "bg-rose-500/20", text: "text-rose-400", border: "border-rose-500/30" },
  { bg: "bg-teal-500/20", text: "text-teal-400", border: "border-teal-500/30" },
];

function getUserColor(author: string, colorMap: Map<string, number>) {
  if (!colorMap.has(author)) {
    colorMap.set(author, colorMap.size % USER_COLORS.length);
  }
  return USER_COLORS[colorMap.get(author)!];
}

interface CommentThreadProps {
  comments: Comment[];
  onAdd: (text: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
}

export function CommentThread({ comments, onAdd, onDelete }: CommentThreadProps) {
  const { username } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const userColorMap = useMemo(() => {
    const map = new Map<string, number>();
    const uniqueAuthors = [...new Set(comments.map((c) => c.author))];
    uniqueAuthors.forEach((author) => getUserColor(author, map));
    return map;
  }, [comments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onAdd(newComment.trim());
      setNewComment("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
        Comments ({comments.length})
      </h3>

      {comments.length === 0 && (
        <p className="text-sm text-zinc-500 italic">No comments yet. Be the first!</p>
      )}

      <div className="space-y-3">
        {comments.map((comment) => {
          const color = getUserColor(comment.author, userColorMap);
          return (
          <div
            key={comment.id}
            className={`group rounded-lg border ${color.border} bg-zinc-900/50 p-3`}
          >
            <div className="mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full ${color.bg}`}>
                  <User className={`h-3.5 w-3.5 ${color.text}`} />
                </div>
                <span className={`text-sm font-medium ${color.text}`}>
                  {comment.author}
                </span>
                <span className="text-xs text-zinc-500">
                  {formatRelativeTime(comment.createdAt)}
                </span>
              </div>
              {comment.author === username && (
                <button
                  onClick={() => onDelete(comment.id)}
                  className="opacity-0 transition-opacity group-hover:opacity-100 text-zinc-500 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">{comment.text}</p>
          </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25"
        />
        <button
          type="submit"
          disabled={!newComment.trim() || submitting}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
