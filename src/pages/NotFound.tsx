import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="text-6xl">🔍</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-slate-100">הדף לא נמצא</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">ייתכן שהקישור שגוי או שהמסך הוסר.</p>
      <Link to="/" className="mt-6 inline-block rounded-xl bg-indigo-600 px-5 py-2.5 font-bold text-white hover:bg-indigo-700">
        חזרה למסך הראשי
      </Link>
    </div>
  );
}
