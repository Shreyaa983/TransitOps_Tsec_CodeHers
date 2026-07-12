import { Globe, Loader2 } from "lucide-react";
import { LANGUAGES, useTranslation } from "@/lib/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  compact?: boolean;
};

export function LanguageSwitcher({ className, compact }: Props) {
  const { lang, loading, changeLanguage } = useTranslation();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select
        value={lang}
        onValueChange={(v) => changeLanguage(v as typeof lang)}
        disabled={loading}
      >
        <SelectTrigger
          className={cn(
            "h-10 brutal-input bg-card",
            compact ? "w-[130px]" : "w-[160px]",
          )}
          aria-label="Select language"
        >
          <div className="flex items-center gap-2">
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            ) : (
              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.map((l) => (
            <SelectItem key={l.code} value={l.code}>
              {l.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
