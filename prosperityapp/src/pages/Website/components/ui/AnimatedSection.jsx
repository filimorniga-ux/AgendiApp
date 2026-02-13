import React from 'react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

export const AnimatedSection = ({ children, delay = 0 }) => {
    const [ref, isIntersecting] = useIntersectionObserver({ threshold: 0.1 });

    return (
        <div
            ref={ref}
            style={{ transitionDelay: `${delay}ms` }}
            className={`
        transition-all duration-1000 ease-out transform
        ${isIntersecting ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-12 blur-sm'}
      `}
        >
            {children}
        </div>
    );
};
