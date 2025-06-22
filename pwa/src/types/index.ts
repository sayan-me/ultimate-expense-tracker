export type Theme = 'light' | 'dark' | 'system';

export type UserPreferences = {
  theme: Theme;
  currency: string;
  language: string;
};

export type NavItem = {
  title: string;
  href: string;
  icon?: string;
}; 