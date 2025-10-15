// types/global.d.ts

// Allow importing SVGs as React components
declare module "*.svg" {
  const content: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  export default content;
}

// Extend window object if needed (example)
interface Window {
  // Used in debugging, hotkey hacks, etc.
  __MY_DEBUG_FLAG__?: boolean;
}

// Theme modes used by `next-themes`
type ThemeMode = "light" | "dark" | "system";

// Generic type helpers
type Nullable<T> = T | null;
type Optional<T> = T | undefined;

// SEO metadata type (align with `lib/seo.ts`)
interface DefaultMeta {
  title: string;
  description: string;
  keywords?: string;
}

// Tailwind utility: fix className typo safety with cva or clsx if needed
type ClassName = string | undefined | null | false;

// If you plan to use custom event types:
interface CustomEventMap {
  "user:logout": void;
  "theme:change": { theme: ThemeMode };
}
