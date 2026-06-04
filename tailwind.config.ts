import type { Config } from 'tailwindcss';
const config: Config = { content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'], theme: { extend: { colors: { cream: '#FFF8EE', teal: '#0F766E', saffron: '#D98A24', lavender: '#EEF2FF' }, boxShadow: { soft: '0 18px 45px rgba(15, 118, 110, 0.12)' } } }, plugins: [] };
export default config;
