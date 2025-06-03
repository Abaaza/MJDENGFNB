import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Bars3Icon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import logo from '/vite.svg';

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  const links = [
    { name: 'Projects', to: '/' },
    { name: 'New Project', to: '/new-project', icon: PlusIcon },
    { name: 'Price Match', to: '/price-match' },
  ];

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-brand-dark text-white p-2 rounded"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
      </button>

      <aside
        className={clsx(
          'bg-brand-dark text-white min-h-screen flex flex-col transition-all duration-200',
          'fixed md:static top-0 left-0 z-40',
          open ? 'w-60' : 'w-0 md:w-60',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex items-center gap-2 p-6">
          <img src={logo} className="h-6 w-6" alt="logo" />
          <span className="font-bold hidden md:inline">MJD Engineering</span>
        </div>

        {links.map(({ name, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              clsx(
                'px-6 py-3 hover:bg-brand-accent/30 flex items-center gap-2',
                isActive && 'bg-brand-accent/50'
              )
            }
          >
            {Icon && <Icon className="h-4 w-4" />}
            {name}
          </NavLink>
        ))}

        <div className="mt-auto px-6 py-4 text-xs text-gray-400 hidden md:block">
          © {new Date().getFullYear()} MJD Engineering
        </div>
      </aside>
    </>
  );
}
