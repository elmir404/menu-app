"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSession } from "next-auth/react";

// "all" = bütün filiallar, "none" = Ümumi (filialsız / branchId null), number = konkret filial
export type BranchScope = "all" | "none" | number;

interface BranchScopeContextValue {
  scope: BranchScope;
  setScope: (scope: BranchScope) => void;
  /** Branch Admin (session.branchId set) — scope öz filialına kilidlənir */
  locked: boolean;
}

const BranchScopeContext = createContext<BranchScopeContextValue | undefined>(
  undefined
);

const STORAGE_KEY = "admin.branchScope";

function parseStored(raw: string | null): BranchScope | null {
  if (!raw) return null;
  if (raw === "all" || raw === "none") return raw;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function BranchScopeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const lockedBranchId = session?.branchId ?? null;
  const locked = lockedBranchId != null;

  const [scope, setScopeState] = useState<BranchScope>("all");

  // Branch Admin üçün scope-u öz filialına kilidlə; əks halda localStorage-dən bərpa et
  useEffect(() => {
    if (locked) {
      setScopeState(lockedBranchId as number);
      return;
    }
    const stored = parseStored(
      typeof window !== "undefined"
        ? window.localStorage.getItem(STORAGE_KEY)
        : null
    );
    if (stored !== null) setScopeState(stored);
  }, [locked, lockedBranchId]);

  const setScope = useMemo(
    () => (next: BranchScope) => {
      if (locked) return;
      setScopeState(next);
      try {
        window.localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        /* localStorage əlçatan deyil — yox say */
      }
    },
    [locked]
  );

  const value = useMemo(
    () => ({ scope, setScope, locked }),
    [scope, setScope, locked]
  );

  return (
    <BranchScopeContext.Provider value={value}>
      {children}
    </BranchScopeContext.Provider>
  );
}

export function useBranchScope() {
  const ctx = useContext(BranchScopeContext);
  if (!ctx) {
    throw new Error("useBranchScope must be used within BranchScopeProvider");
  }
  return ctx;
}

/** Verilən branchId cari scope-a uyğundurmu (client-side filter üçün) */
export function matchesBranchScope(
  branchId: number | null | undefined,
  scope: BranchScope
): boolean {
  if (scope === "all") return true;
  if (scope === "none") return branchId == null;
  return branchId === scope;
}

/** Scope-dan konkret branchId çıxar (create/reorder üçün): all/none → null */
export function scopeToBranchId(scope: BranchScope): number | null {
  return typeof scope === "number" ? scope : null;
}
