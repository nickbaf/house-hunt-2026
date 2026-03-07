import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useData } from "@/context/DataContext";
import { PropertyForm } from "@/components/PropertyForm";

export function AddProperty() {
  const navigate = useNavigate();
  const { addProperty } = useData();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <h1 className="mb-6 text-2xl font-bold text-zinc-100">Add Property</h1>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <PropertyForm
          onSubmit={async (data) => {
            await addProperty(data);
            navigate("/");
          }}
          onCancel={() => navigate(-1)}
          submitLabel="Add Property"
        />
      </div>
    </div>
  );
}
