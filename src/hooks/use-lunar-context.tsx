import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LUNAR_STATE,
  type LunarState,
} from "@/lib/lunar";

interface LunarContextValue {
  state: LunarState;
  updateState: (patch: Partial<LunarState>) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isExporting: boolean;
  setIsExporting: (v: boolean) => void;
}

const LunarContext = createContext<LunarContextValue | null>(null);

export function LunarProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LunarState>(DEFAULT_LUNAR_STATE);
  const [isExporting, setIsExporting] = useState(false);

  const historyRef = useRef<LunarState[]>([DEFAULT_LUNAR_STATE]);
  const indexRef = useRef(0);

  const updateState = useCallback((patch: Partial<LunarState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      const hist = historyRef.current.slice(0, indexRef.current + 1);
      hist.push(next);
      historyRef.current = hist;
      indexRef.current = hist.length - 1;
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    if (indexRef.current > 0) {
      indexRef.current -= 1;
      setState(historyRef.current[indexRef.current]);
    }
  }, []);

  const redo = useCallback(() => {
    if (indexRef.current < historyRef.current.length - 1) {
      indexRef.current += 1;
      setState(historyRef.current[indexRef.current]);
    }
  }, []);

  const value = useMemo(
    () => ({
      state,
      updateState,
      undo,
      redo,
      canUndo: indexRef.current > 0,
      canRedo: indexRef.current < historyRef.current.length - 1,
      isExporting,
      setIsExporting,
    }),
    [state, updateState, undo, redo, isExporting],
  );

  return (
    <LunarContext.Provider value={value}>{children}</LunarContext.Provider>
  );
}

export function useLunar(): LunarContextValue {
  const ctx = useContext(LunarContext);
  if (!ctx) throw new Error("useLunar must be used within LunarProvider");
  return ctx;
}
