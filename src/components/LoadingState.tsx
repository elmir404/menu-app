"use client";

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message }: LoadingStateProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50">
      <div className="flex flex-col items-center gap-3">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-stone-800" />
        {message && (
          <p className="text-sm text-stone-500">{message}</p>
        )}
      </div>
    </div>
  );
}
