import React from 'react';
import { Page } from '../types';
import { HomeIcon, TransactionsIcon, AccountsIcon, TrendsIcon, GoalsIcon, BillsIcon, CategorizeIcon, SettingsIcon, DebtsIcon, RecurringIcon, FinancialFlowIcon } from './icons';

interface SidebarProps {
    currentPage: Page;
    navigateTo: (page: Page) => void;
}

const NavItem: React.FC<{ icon: React.ElementType; label: Page; isActive: boolean; onClick: () => void }> = ({ icon: Icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        title={label}
        className={`flex items-center justify-center w-12 h-12 rounded-lg transition-colors duration-200 ${
            isActive ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
        }`}
    >
        <Icon className="w-6 h-6" />
    </button>
);

const Sidebar: React.FC<SidebarProps> = ({ currentPage, navigateTo }) => {
    const navItems = [
        { icon: HomeIcon, label: Page.Dashboard },
        { icon: TransactionsIcon, label: Page.Transactions },
        { icon: AccountsIcon, label: Page.Accounts },
        { icon: DebtsIcon, label: Page.Debts },
        { icon: TrendsIcon, label: Page.Trends },
        { icon: GoalsIcon, label: Page.Goals },
        { icon: BillsIcon, label: Page.Bills },
        { icon: RecurringIcon, label: Page.Recurring },
        { icon: CategorizeIcon, label: Page.Categorize },
    ];

     const bottomNavItems = [
        { icon: SettingsIcon, label: Page.Settings }
    ];

    return (
        <aside className="w-20 h-screen bg-base-bg p-4 border-r border-border-color flex flex-col items-center sticky top-0">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-6">
                <FinancialFlowIcon className="w-7 h-7 text-white" />
            </div>
            <nav className="flex-1 flex flex-col items-center space-y-3">
                {navItems.map(item => (
                    <NavItem
                        key={item.label}
                        icon={item.icon}
                        label={item.label}
                        isActive={currentPage === item.label}
                        onClick={() => navigateTo(item.label)}
                    />
                ))}
            </nav>
            <div className="mt-auto flex flex-col items-center space-y-3">
                 {bottomNavItems.map(item => (
                    <NavItem
                        key={item.label}
                        icon={item.icon}
                        label={item.label}
                        isActive={currentPage === item.label}
                        onClick={() => navigateTo(item.label)}
                    />
                ))}
            </div>
        </aside>
    );
};

export default Sidebar;