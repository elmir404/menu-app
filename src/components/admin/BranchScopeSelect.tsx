"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBranches } from "@/hooks/use-branches";
import type { BranchScope } from "@/contexts/BranchScopeContext";

function scopeToValue(scope: BranchScope): string {
  return String(scope);
}

function valueToScope(value: string): BranchScope {
  if (value === "all" || value === "none") return value;
  return Number(value);
}

export function BranchScopeSelect({
  value,
  onChange,
  includeAll = false,
  disabled = false,
  className = "w-[200px]",
  placeholder = "Filial",
}: {
  value: BranchScope;
  onChange: (scope: BranchScope) => void;
  /** list filter üçün "Hamısı" opsiyasını göstər */
  includeAll?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}) {
  const { data: branches } = useBranches();

  return (
    <Select
      value={scopeToValue(value)}
      onValueChange={(v) => onChange(valueToScope(v))}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {includeAll && <SelectItem value="all">Bütün filiallar</SelectItem>}
        <SelectItem value="none">Ümumi (filialsız)</SelectItem>
        {(branches ?? []).map((b) => (
          <SelectItem key={b.id} value={String(b.id)}>
            {b.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
