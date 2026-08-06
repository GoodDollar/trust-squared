interface WelcomeProps {
  onComplete: () => void;
}

export default function Welcome({ onComplete }: WelcomeProps) {
  return (
    <div className="min-h-screen bg-t2-dark flex flex-col items-center justify-between px-6 py-16">
      <div />

      <div className="flex flex-col items-center text-center">
        {/* Sound wave bars icon */}
        <div className="flex items-end gap-1.5 mb-4">
          <div className="w-1.5 h-5 bg-green-500 rounded-full" />
          <div className="w-1.5 h-9 bg-green-500 rounded-full" />
          <div className="w-1.5 h-7 bg-green-500 rounded-full" />
          <div className="w-1.5 h-10 bg-green-500 rounded-full" />
          <div className="w-1.5 h-6 bg-green-500 rounded-full" />
        </div>

        <h1 className="text-green-500 text-3xl font-bold">
          Trust<sup className="text-base align-super">2</sup>
        </h1>

        <p className="text-gray-400 text-sm mt-4 leading-relaxed max-w-[220px]">
          Build your reputation through trust and contributions.
        </p>
      </div>

      <button
        onClick={onComplete}
        className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-semibold text-base transition-all active:scale-[0.98]"
      >
        Get Started
      </button>
    </div>
  );
}
