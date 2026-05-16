import {
  Bot,
  Code2,
  Mic2,
  Palette,
  Sparkles,
  Trophy,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Tech: Code2,
  Robotics: Bot,
  Design: Palette,
  Cultural: Mic2,
  Sports: Trophy,
  Workshop: Wrench,
  General: Sparkles,
};

export function getCategoryIcon(category: string): LucideIcon {
  return CATEGORY_ICONS[category] ?? Sparkles;
}
