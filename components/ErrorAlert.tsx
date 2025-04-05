interface ErrorAlertProps {
  message: string;
  error: Error;
  onRetry: () => void;
}

export default function ErrorAlert({
  message,
  error,
  onRetry,
}: ErrorAlertProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full text-center">
        <h2 className="text-red-800 text-xl font-semibold mb-2">{message}</h2>
        <p className="text-red-600 mb-4">{error.message}</p>
        <button
          onClick={onRetry}
          className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
