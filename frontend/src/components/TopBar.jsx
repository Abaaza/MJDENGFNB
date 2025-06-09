import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function TopBar() {
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
  }

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-black text-white shadow">
      <h2 className="text-lg font-medium">
        Welcome,&nbsp;<span className="font-semibold">{user.name}</span>
      </h2>

      <Menu as="div" className="relative">
        <Menu.Button className="flex items-center gap-2 select-none">
          <UserCircleIcon className="h-7 w-7 text-white" />
          <span className="hidden sm:inline">{user.name}</span>
        </Menu.Button>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 mt-2 w-40 origin-top-right rounded-md bg-white text-black shadow-lg focus:outline-none p-1">
            <Menu.Item>
              {({ active }) => (
                <Link
                  to="/admin"
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } w-full flex items-center gap-2 px-4 py-2 text-sm`}
                >
                  <Cog6ToothIcon className="h-5 w-5" />
                  Admin
                </Link>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleLogout}
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } w-full flex items-center gap-2 px-4 py-2 text-sm`}
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  Logout
                </button>
              )}
            </Menu.Item>
          </Menu.Items>
        </Transition>
      </Menu>
    </header>
  );
}
