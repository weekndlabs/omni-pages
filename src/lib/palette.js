/**
 * Contexere's palette, taken from the mark in media/logo.svg. global.css holds
 * the same values as CSS; this copy exists so the contrast test can hold them
 * to AA. Change both together.
 */
export const PALETTE = {
	dark: {
		ground: '#14172A', panel: '#1B1F36', rule: '#2C3150',
		ink: '#E6E8F2', inkSoft: '#8F94B0',
		t1: '#5FAEF5', t2: '#9187F0', t3: '#3FD4B4',
	},
	light: {
		ground: '#EEF0F6', panel: '#E3E6F0', rule: '#CDD1E0',
		ink: '#14172A', inkSoft: '#565B78',
		t1: '#2F7FE0', t2: '#5B4FD6', t3: '#0E7462',
	},
};

const luminance = (hex) => {
	const [r, g, b] = [1, 3, 5].map((i) => {
		const c = parseInt(hex.slice(i, i + 2), 16) / 255;
		return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** WCAG 2 contrast ratio between two #RRGGBB colours. */
export function contrast(a, b) {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
}
