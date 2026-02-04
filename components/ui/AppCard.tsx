import React from 'react';

interface AppCardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    hoverEffect?: boolean;
}

export const AppCard: React.FC<AppCardProps> = ({ children, className = '', onClick, hoverEffect = true }) => {
    return (
        <div 
            onClick={onClick}
            className={`bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden ${hoverEffect ? 'hover:border-blue-200 hover:shadow-md hover:shadow-blue-100/50 hover:-translate-y-0.5 transition-all duration-300' : ''} ${className}`}
        >
            {children}
        </div>
    );
};
