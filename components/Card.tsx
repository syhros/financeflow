import React from 'react';

interface CardProps {
    // FIX: Made children optional to allow the component to be used as a container without content.
    children?: React.ReactNode;
    className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
    return (
        <div className={`bg-card-bg border border-border-color rounded-2xl p-6 ${className}`}>
            {children}
        </div>
    );
};

export default Card;