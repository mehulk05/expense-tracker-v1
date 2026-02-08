import React from 'react';

interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    icon?: React.ReactNode;
}

export const AppButton: React.FC<AppButtonProps> = ({ 
    variant = 'primary', 
    size = 'md', 
    isLoading = false, 
    icon, 
    children, 
    className = '',
    ...props 
}) => {
    const baseStyles = "font-bold rounded-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none";
    
    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-100",
        secondary: "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400",
        danger: "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100",
        ghost: "bg-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-5 py-2.5 text-sm",
        lg: "px-6 py-3.5 text-base"
    };

    return (
        <button 
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : icon}
            {children}
        </button>
    );
};
