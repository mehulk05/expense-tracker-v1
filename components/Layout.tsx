import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ICONS } from '../constants';
import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  interface NavItem {
    name: string;
    path: string;
    icon: any;
    children?: NavItem[];
  }

  const navItems: NavItem[] = [
    { name: 'Dashboard', path: '/dashboard', icon: ICONS.Dashboard },
    { 
      name: 'Tasks', 
      path: '/todo', 
      icon: ICONS.Check,
      children: [
        { name: 'Overview', path: '/todo', icon: ICONS.Dashboard },
        { name: 'Todos', path: '/todo/list', icon: ICONS.CheckCircle }
      ]
    },
    { 
      name: 'Expenses', 
      path: '/expenses', 
      icon: ICONS.Expense,
      children: [
        { name: 'Overview', path: '/expenses/overview', icon: ICONS.Dashboard },
        { name: 'Actual Expense', path: '/expenses', icon: ICONS.Expense },
        { name: 'Future Expense', path: '/planned', icon: ICONS.Calendar }
      ]
    },
    { name: 'Card and Accounts', path: '/accounts', icon: ICONS.Account },
    { name: 'Categories', path: '/categories', icon: ICONS.Category },
    { name: 'Budget', path: '/budget', icon: ICONS.Dashboard },
    { name: 'Credit Card Bills', path: '/credit-cards', icon: ICONS.Cards },
    { 
      name: 'Splitwise', 
      path: '/splitwise', 
      icon: ICONS.Users,
      children: [
        { name: 'Overview', path: '/splitwise', icon: ICONS.Dashboard },
        { name: 'Groups', path: '/splitwise/groups', icon: ICONS.Cards },
        { name: 'Friends', path: '/splitwise/people', icon: ICONS.Account }
      ]
    },
    { name: 'Activity', path: '/private-tracker', icon: ICONS.CheckCircle },
    { name: 'Policy Vault', path: '/policy-vault', icon: ICONS.Document },
    { name: 'Diary', path: '/diary', icon: ICONS.CheckCircle },
    // { name: 'Templates', path: '/templates', icon: ICONS.FileStack },
  ];

  const renderNavItem = (item: NavItem, depth = 0) => {
      const isChildActive = item.children?.some(child => location.pathname === child.path || location.pathname.startsWith(child.path));
      
      let isActive = false;
      if (item.children) {
           isActive = location.pathname === item.path || isChildActive || (location.pathname.startsWith(item.path) && item.path !== '/');
      } else {
          isActive = location.pathname === item.path;
      }
      
      const Icon = item.icon;
      const isChild = depth > 0;
      const isExpanded = item.children && isActive;

      return (
        <div key={item.path}>
            <Link
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group flex-1 w-full ${
                isActive && !item.children
                    ? 'text-blue-600 bg-blue-50 font-bold' 
                    : isActive && item.children
                    ? 'text-gray-900 font-bold' 
                    : 'text-gray-500 hover:text-blue-600 hover:bg-gray-50 font-medium' 
                } ${isChild ? 'pl-11 text-xs' : ''}`}
            >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'}`} />
                <span className="font-bold text-sm">{item.name}</span>
                {item.children && (
                     <ICONS.ChevronRight className={`w-4 h-4 ml-auto transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                )}
            </Link>
            
            {isExpanded && item.children && (
                <div className="mt-1 space-y-1">
                    {item.children.map(child => renderNavItem(child, depth + 1))}
                </div>
            )}
        </div>
      );
  };

  const userInitial = user?.displayName?.[0] || user?.email?.[0] || 'U';

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r border-gray-200 sticky top-0 h-screen z-40">
        <div className="p-8 flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-200">
            S
          </div>
          <span className="text-lg font-extrabold text-gray-900 tracking-tight">SpendWise</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {navItems.map(item => renderNavItem(item))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all group"
          >
            <svg className="w-5 h-5 group-hover:text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            <span className="font-bold text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col pb-20 md:pb-0">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
          <h1 className="text-sm font-bold text-gray-900 uppercase tracking-widest">
            {navItems.find(i => i.path === location.pathname)?.name || 'Dashboard'}
          </h1>
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
               <p className="text-xs font-bold text-gray-900">{user?.displayName || 'User'}</p>
               <p className="text-[10px] text-gray-400 font-semibold">{user?.email}</p>
             </div>
             <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-blue-600 font-bold uppercase text-sm">
               {userInitial}
             </div>
          </div>
        </header>
        
        <div className="p-4 md:p-8 w-full">
          {children}
        </div>
      </main>

      {/* Bottom Nav - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 flex justify-around items-center h-16 px-2 z-40">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
                isActive ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : ''}`} />
              <span className="text-[9px] font-bold uppercase tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Layout;
