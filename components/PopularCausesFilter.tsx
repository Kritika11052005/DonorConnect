import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface PopularCausesFilterProps {
  selectedCause?: string;
  onCauseSelect: (cause: string | undefined) => void;
}

export default function PopularCausesFilter({ 
  selectedCause, 
  onCauseSelect 
}: PopularCausesFilterProps) {
  // This will automatically update when verified NGOs/campaigns change
  const popularCauses = useQuery(api.popularityScores.getPopularCauses);

  // Show loading state
  if (popularCauses === undefined) {
    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Popular Causes
        </h3>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-10 w-32 bg-gray-200 rounded-full animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!popularCauses || popularCauses.length === 0) {
    return null; // Don't show the filter if there are no causes
  }

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
        Popular Causes
      </h3>
      <div className="flex flex-wrap gap-2">
        {/* "All" button to clear filter */}
        <button
          onClick={() => onCauseSelect(undefined)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            !selectedCause
              ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>

        {popularCauses.map(({ cause, count }) => (
          <button
            key={cause}
            onClick={() => onCauseSelect(cause.toLowerCase())}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedCause === cause.toLowerCase()
                ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md'
                : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-rose-300 hover:shadow-md'
            }`}
          >
            {cause} ({count})
          </button>
        ))}
      </div>
    </div>
  );
}