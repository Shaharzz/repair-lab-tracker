import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

interface MagicCardProps {
    children: React.ReactNode;
    className?: string;
    spotlightRadius?: number;
}

export const MagicCard = ({ children, className = "", spotlightRadius = 160 }: MagicCardProps) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const spotlightRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const card = cardRef.current;
        const spotlight = spotlightRef.current;
        if (!card || !spotlight) return;

        const onMouseMove = (e: MouseEvent) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            gsap.to(spotlight, {
                opacity: 1,
                x: x - spotlightRadius,
                y: y - spotlightRadius,
                duration: 0.3,
                ease: "power2.out",
            });
        };

        const onMouseLeave = () => {
            gsap.to(spotlight, { opacity: 0, duration: 0.3 });
        };

        card.addEventListener('mousemove', onMouseMove);
        card.addEventListener('mouseleave', onMouseLeave);

        return () => {
            card.removeEventListener('mousemove', onMouseMove);
            card.removeEventListener('mouseleave', onMouseLeave);
        };
    }, [spotlightRadius]);

    return (
        <div
            ref={cardRef}
            className={`relative overflow-hidden bg-white rounded-3xl border border-gray-100 shadow-xl ${className}`}
        >
            {/* הילה (Spotlight) */}
            <div
                ref={spotlightRef}
                className="pointer-events-none absolute opacity-0 z-0 transition-opacity"
                style={{
                    width: spotlightRadius * 2,
                    height: spotlightRadius * 2,
                    background: `radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)`,
                    borderRadius: '50%',
                }}
            />
            <div className="relative z-10">{children}</div>
        </div>
    );
};