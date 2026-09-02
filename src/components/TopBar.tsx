import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { ThemeToggle } from './ThemeToggle';

export function TopBar() {
  const currentUser = useAuth((s) => s.currentUser);
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-sky-500 text-lg font-black text-white">
            ⚡
          </span>
          <span className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Warranty360</span>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {currentUser ? (
            <>
              <div className="hidden text-left text-sm sm:block">
                <p className="font-medium text-slate-900 dark:text-slate-100">{currentUser.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400" dir="ltr">
                  {currentUser.phone ?? currentUser.email ?? ''}
                </p>
              </div>
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                יציאה
              </button>
            </>
          ) : (
            <Link
              to="/"
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              התחברות
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
