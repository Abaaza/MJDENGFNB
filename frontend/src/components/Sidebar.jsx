import { NavLink } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import logo from '/vite.svg';

export default function Sidebar() {
  const links = [
    { name: 'Projects', to: '/' },
    { name: 'New Project', to: '/new-project', icon: PlusIcon },
    { name: 'Price Match', to: '/price-match' },
    { name: 'Admin', to: '/admin' },
  ];
  return (
    <nav className="bg-brand-dark text-white flex items-center gap-6 px-6 py-3">
      <div className="flex items-center gap-2">
        <img src={logo} className="h-6 w-6" alt="logo" />
        <span className="font-bold">MJD Engineering</span>
      </div>

      {links.map(({ name, to, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            clsx(
              'px-3 py-2 rounded hover:bg-brand-accent/30 flex items-center gap-2',
              isActive && 'bg-brand-accent/50'
            )
          }
        >
          {Icon && <Icon className="h-4 w-4" />}
          {name}
        </NavLink>
      ))}
    </nav>
  );
}
