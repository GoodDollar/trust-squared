import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this data. Please try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center py-10 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-red-600/15 flex items-center justify-center mb-3">
        <AlertTriangle className="h-6 w-6 text-red-400" />
      </div>
      <h3 className="text-white font-medium mb-1">{title}</h3>
      <p className="text-gray-500 text-sm mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 text-green-400 text-sm font-medium bg-green-600/15 px-4 py-2 rounded-full hover:bg-green-600/25 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Try Again
        </button>
      )}
    </div>
  );
}
