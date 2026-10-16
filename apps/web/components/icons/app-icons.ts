import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Check,
  CheckSquare,
  ChevronDown,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  Globe2,
  Hash,
  LayoutDashboard,
  LayoutTemplate,
  ListChecks,
  Loader2,
  LockKeyhole,
  Mail,
  Menu,
  MessageSquare,
  Moon,
  MoreHorizontal,
  Pencil,
  Plus,
  Sparkles,
  Star,
  Sun,
  Text,
  Trash2,
  TriangleAlert,
  Type,
  User,
} from "lucide-react";

export type { LucideIcon };

// Semantic icon mapping
export const IconAi = Sparkles;
export const IconCreate = Plus;
export const IconEdit = Pencil;
export const IconDelete = Trash2;
export const IconCopy = Copy;
export const IconOpenExternal = ExternalLink;
export const IconPreview = Eye;
export const IconPublish = Globe2;
export const IconDashboard = LayoutDashboard;
export const IconForms = FileText;
export const IconTemplates = LayoutTemplate;
export const IconResponses = MessageSquare;
export const IconAnalytics = BarChart3;
export const IconUser = User;
export const IconEmail = Mail;
export const IconPassword = LockKeyhole;
export const IconSpinner = Loader2;
export const IconMore = MoreHorizontal;
export const IconBack = ArrowLeft;
export const IconCheck = Check;
export const IconRating = Star;
export const IconSun = Sun;
export const IconMoon = Moon;
export const IconMenu = Menu;
export const IconWarning = TriangleAlert;

// Field type icon registry
export const fieldTypeIcons: Record<string, LucideIcon> = {
  text: Type,
  textarea: Text,
  email: Mail,
  number: Hash,
  select: ChevronDown,
  multiselect: ListChecks,
  checkbox: CheckSquare,
  rating: Star,
  date: CalendarDays,
};
