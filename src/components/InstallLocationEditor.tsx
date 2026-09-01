import { useState } from 'react';
import { useUpdateProduct } from '../hooks/useProducts';

/** יש להרכיב עם key={product._id} כדי שהמצב המקומי יתאפס אוטומטית במעבר בין מוצרים. */
export function InstallLocationEditor({ productId, initialValue }: { productId: string; initialValue: string }) {
  const [location, setLocation] = useState(initialValue);
  const [saved, setSaved] = useState(false);
  const updateProduct = useUpdateProduct();

  function save() {
    updateProduct.mutate(
      { id: productId, reportedInstallLocation: location },
      { onSuccess: () => setSaved(true) },
    );
  }

  return (
    <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        מיקום ההתקנה בבית (למשל: סלון, חדר ילדים)
      </label>
      <div className="mt-2 flex gap-2">
        <input
          value={location}
          onChange={(e) => {
            setLocation(e.target.value);
            setSaved(false);
          }}
          placeholder="איפה המוצר מותקן בפועל?"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
        />
        <button
          onClick={save}
          disabled={updateProduct.isPending}
          className="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          שמירת מיקום
        </button>
      </div>
      {saved && <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">✓ המיקום נשמר.</p>}
    </div>
  );
}
