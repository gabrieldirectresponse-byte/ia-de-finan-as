
import { Category, Transaction } from './types';

export const COLORS = {
  canvasBase: '#09090B',
  surfaceHigh: '#18181B',
  surfaceLow: '#27272A',
  primaryBrand: '#00DC82',
  functionalRed: '#EF4444',
  textPrimary: '#F4F4F5',
  textMuted: '#A1A1AA',
};

export const DISTINCT_COLORS = [
  '#00DC82', // Spring Green
  '#3B82F6', // Blue
  '#F97316', // Orange
  '#A855F7', // Purple
  '#EF4444', // Red
  '#EC4899', // Pink
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#8B5CF6', // Violet
  '#F43F5E', // Rose
  '#6366F1', // Indigo
  '#84CC16', // Lime
  '#14B8A6', // Teal
  '#D946EF', // Fuchsia
  '#FB923C', // Light Orange
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: '1', name: 'Alimentação', icon: '🍔', color: '#F97316' },
  { id: '2', name: 'Transporte', icon: '🚗', color: '#3B82F6' },
  { id: '3', name: 'Lazer', icon: '🎬', color: '#A855F7' },
  { id: '4', name: 'Saúde', icon: '🏥', color: '#EF4444' },
  { id: '5', name: 'Educação', icon: '📚', color: '#10B981' },
  { id: '6', name: 'Moradia', icon: '🏠', color: '#F59E0B' },
  { id: '7', name: 'Compras', icon: '🛍️', color: '#EC4899' },
  { id: '8', name: 'Salário', icon: '💰', color: '#00DC82' },
  { id: '9', name: 'Outros', icon: '📦', color: '#71717A' },
];

export const INITIAL_LEDGER: Transaction[] = [];
