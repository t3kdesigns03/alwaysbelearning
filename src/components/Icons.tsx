const base = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': true } as const;
export const Arrow = ({ size = 20 }: { size?: number }) => (<svg {...base} width={size} height={size} class="arrow"><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
export const Back = () => (<svg {...base}><path d="M19 12H5M11 18l-6-6 6-6" /></svg>);
export const Close = () => (<svg {...base}><path d="M6 6l12 12M18 6L6 18" /></svg>);
export const Gear = () => (<svg {...base}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></svg>);
export const Eye = ({ off = false }: { off?: boolean }) => (<svg {...base}><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />{off && <path d="M3 3l18 18" />}</svg>);
export const Check = () => (<svg {...base} width={16} height={16}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>);
export const Spark = () => (<svg {...base} width={16} height={16}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6" /></svg>);
export const Delete = () => (<svg {...base}><path d="M9 6h11v12H9l-6-6 6-6z" /><path d="M13 10l4 4M17 10l-4 4" /></svg>);
