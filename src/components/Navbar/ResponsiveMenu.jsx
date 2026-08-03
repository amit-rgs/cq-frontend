import { X } from 'lucide-react';
import React from 'react';
import { FaUserCircle } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const ResponsiveMenu = ({ showMenu, setShowMenu, onMyAccountClick }) => {
  return (
    <>
      {/* Backdrop overlay */}
      {showMenu && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] md:hidden"
          onClick={() => setShowMenu(false)}
        ></div>
      )}

      {/* Menu */}
      <div
        className={`${
          showMenu ? 'right-0' : '-right-[100%]'
        } fixed bottom-0 top-0 z-[70] flex h-screen w-[75%] flex-col justify-between bg-white px-8 pb-6 pt-16 text-black transition-all duration-200 md:hidden rounded-r-xl shadow-md`}
      >
        <div>
          <button
            className="border border-black rounded-lg absolute top-4 right-9 p-1"
            onClick={() => setShowMenu(false)}
          >
            <X />
          </button>
          <div className="flex items-center justify-start gap-3">
            <FaUserCircle size={50} />
            <div>
              <h1>Hello User</h1>
              <h1 className="text-sm text-slate-500">Premium User</h1>
            </div>
          </div>
          <nav className="mt-12">
            <ul className="space-y-4 text-xl text-black flex flex-col">
              <Link to="/">
                <li onClick={() => setShowMenu(false)}>Home</li>
              </Link>
              <Link to="/contact">
                <li onClick={() => setShowMenu(false)}>Contact Us</li>
              </Link>

              {/* My Account with click handler */}
              <button
                onClick={() => {
                  setShowMenu(false);
                  if (onMyAccountClick) {
                    onMyAccountClick();
                  }
                }}
                className="text-left"
              >
                <li>My Account</li>
              </button>

              <Link to="/login">
                <button
                  onClick={() => setShowMenu(false)}
                  className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded-md font-semibold transition-all"
                >
                  Login
                </button>
              </Link>
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
};

export default ResponsiveMenu;
