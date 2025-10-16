import React from 'react';

interface CardProps {
    children?: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
    return (
        <div className={`bg-card-bg border border-border-color rounded-2xl p-6 ${className}`} onClick={onClick}>
            {children}
        </div>
    );
};

export default Card;