import { X, Star, TrendingUp, Calendar, Clock, DollarSign, Building2, MapPin } from 'lucide-react';
import CustomDropdown from '@/components/CustomDropDown';

interface FilterPanelProps {
  activeTab: 'hospitals' | 'ngos' | 'campaigns';
  filters: {
    sortBy: 'popular' | 'rating' | 'recent' | 'name' | 'ending_soon' | 'amount_raised';
    category: string;
    city: string;
    status: 'active' | 'completed' | 'all';
    minRating: number;
    hospitalType: '' | 'government' | 'private' | 'trust';
  };
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  onFilterChange: (filters: any) => void;
  onReset: () => void;
  availableCities?: string[];
  popularCauses?: { name: string; count: number }[];
}

export default function FilterPanel({
  activeTab,
  filters,
  onFilterChange,
  onReset,
  availableCities = [],
  popularCauses = [],
}: FilterPanelProps) {
  // Sort By Options
  const getSortOptions = () => {
    const commonOptions = [
      {
        value: 'popular',
        label: 'Most Popular',
        icon: <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />,
        description: 'Highest impact score',
      },
      {
        value: 'rating',
        label: 'Highest Rated',
        icon: <Star className="w-4 h-4 text-orange-500 fill-orange-500" />,
        description: 'Best reviews',
      },
      {
        value: 'recent',
        label: 'Most Recent',
        icon: <Clock className="w-4 h-4 text-blue-500" />,
        description: 'Newest additions',
      },
    ];

    if (activeTab === 'campaigns') {
      return [
        ...commonOptions,
        {
          value: 'ending_soon',
          label: 'Ending Soon',
          icon: <Calendar className="w-4 h-4 text-red-500" />,
          description: 'Urgent campaigns',
        },
        {
          value: 'amount_raised',
          label: 'Most Funded',
          icon: <DollarSign className="w-4 h-4 text-green-500" />,
          description: 'Highest donations',
        },
      ];
    }

    return [
      ...commonOptions,
      {
        value: 'name',
        label: 'Name (A-Z)',
        icon: <span className="text-purple-500 font-bold">A→Z</span>,
        description: 'Alphabetical order',
      },
    ];
  };

  // Category Options
  const categoryOptions = [
    { value: '', label: 'All Categories', icon: <span>📚</span> },
    { value: 'education', label: 'Education', icon: <span>📚</span> },
    { value: 'healthcare', label: 'Healthcare', icon: <span>🏥</span> },
    { value: 'environment', label: 'Environment', icon: <span>🌍</span> },
    { value: 'child welfare', label: 'Child Welfare', icon: <span>👶</span> },
    { value: 'disaster relief', label: 'Disaster Relief', icon: <span>🚨</span> },
    { value: 'animal welfare', label: 'Animal Welfare', icon: <span>🐾</span> },
    { value: 'poverty', label: 'Poverty Alleviation', icon: <span>🤝</span> },
    { value: 'women empowerment', label: 'Women Empowerment', icon: <span>👩</span> },
  ];

  // Hospital Type Options
  const hospitalTypeOptions = [
    { value: '', label: 'All Types', icon: <Building2 className="w-4 h-4 text-gray-500" /> },
    { value: 'government', label: 'Government', icon: <span>🏛️</span> },
    { value: 'private', label: 'Private', icon: <span>🏢</span> },
    { value: 'trust', label: 'Trust', icon: <span>🤲</span> },
  ];

  // Status Options
  const statusOptions = [
    { value: 'all', label: 'All Campaigns', icon: <span>📋</span> },
    { value: 'active', label: 'Active Only', icon: <span>✅</span> },
    { value: 'completed', label: 'Completed Only', icon: <span>🏁</span> },
  ];

  // City Options
  const cityOptions = [
    { value: '', label: 'All Cities', icon: <MapPin className="w-4 h-4 text-gray-500" /> },
    ...availableCities.map((city) => ({
      value: city,
      label: city,
      icon: <MapPin className="w-4 h-4 text-blue-500" />,
    })),
  ];

  // Rating Options
  const ratingOptions = [
    { value: 0, label: 'Any Rating', icon: <Star className="w-4 h-4 text-gray-400" /> },
    { value: 4.5, label: '4.5+ Stars', icon: <span className="flex">⭐⭐⭐⭐⭐</span> },
    { value: 4, label: '4+ Stars', icon: <span className="flex">⭐⭐⭐⭐</span> },
    { value: 3.5, label: '3.5+ Stars', icon: <span className="flex">⭐⭐⭐</span> },
    { value: 3, label: '3+ Stars', icon: <span className="flex">⭐⭐⭐</span> },
    { value: 2, label: '2+ Stars', icon: <span className="flex">⭐⭐</span> },
  ];

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 animate-in slide-in-from-top duration-300">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
          <div className="w-1 h-6 bg-gradient-to-b from-rose-500 to-pink-500 rounded-full"></div>
          Filter Options
        </h3>
        <button
          onClick={onReset}
          className="text-sm text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1 transition-all hover:gap-2 px-3 py-1.5 rounded-lg hover:bg-rose-50"
        >
          <X className="w-4 h-4" />
          Reset All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sort By */}
        <CustomDropdown
          label="Sort By"
          value={filters.sortBy}
          options={getSortOptions()}
          onChange={(value) => onFilterChange({ ...filters, sortBy: value })}
          placeholder="Select sorting"
        />

        {/* Category (for NGOs and Campaigns) */}
        {(activeTab === 'ngos' || activeTab === 'campaigns') && (
          <CustomDropdown
            label="Category"
            value={filters.category}
            options={categoryOptions}
            onChange={(value) => onFilterChange({ ...filters, category: value })}
            placeholder="Select category"
          />
        )}

        {/* Hospital Type */}
        {activeTab === 'hospitals' && (
          <CustomDropdown
            label="Hospital Type"
            value={filters.hospitalType}
            options={hospitalTypeOptions}
            onChange={(value) => onFilterChange({ ...filters, hospitalType: value })}
            placeholder="Select type"
          />
        )}

        {/* Campaign Status */}
        {activeTab === 'campaigns' && (
          <CustomDropdown
            label="Campaign Status"
            value={filters.status}
            options={statusOptions}
            onChange={(value) => onFilterChange({ ...filters, status: value })}
            placeholder="Select status"
          />
        )}

        {/* City */}
        <CustomDropdown
          label="📍 Location"
          value={filters.city}
          options={cityOptions}
          onChange={(value) => onFilterChange({ ...filters, city: value })}
          placeholder="Select city"
        />

        {/* Min Rating */}
        <CustomDropdown
          label="Minimum Rating"
          value={filters.minRating.toString()}
          options={ratingOptions.map((opt) => ({
            ...opt,
            value: opt.value.toString(),
          }))}
          onChange={(value) => onFilterChange({ ...filters, minRating: Number(value) })}
          placeholder="Select rating"
        />
      </div>

      {/* Active Filters Summary */}
      {Object.values(filters).filter(
        (v) => v && v !== 'popular' && v !== 'all' && v !== 0 && v !== ''
      ).length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">
            Active Filters:
          </p>
          <div className="flex flex-wrap gap-2">
            {filters.sortBy !== 'popular' && (
              <span className="px-4 py-2 bg-rose-100 text-rose-700 rounded-full text-sm font-semibold shadow-sm">
                Sort: {getSortOptions().find((o) => o.value === filters.sortBy)?.label}
              </span>
            )}
            {filters.category && (
              <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold shadow-sm">
                {categoryOptions.find((o) => o.value === filters.category)?.label}
              </span>
            )}
            {filters.city && (
              <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold shadow-sm">
                📍 {filters.city}
              </span>
            )}
            {filters.status !== 'all' && (
              <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold shadow-sm">
                {statusOptions.find((o) => o.value === filters.status)?.label}
              </span>
            )}
            {filters.minRating > 0 && (
              <span className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold shadow-sm">
                ⭐ {filters.minRating}+ Rating
              </span>
            )}
            {filters.hospitalType && (
              <span className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold shadow-sm">
                {hospitalTypeOptions.find((o) => o.value === filters.hospitalType)?.label}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Quick Category Filters */}
      {(activeTab === 'ngos' || activeTab === 'campaigns') &&
        popularCauses.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">
              Quick Filters by Category:
            </p>
            <div className="flex flex-wrap gap-2">
              {popularCauses.slice(0, 6).map((cause) => (
                <button
                  key={cause.name}
                  onClick={() =>
                    onFilterChange({
                      ...filters,
                      category: cause.name.toLowerCase(),
                    })
                  }
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    filters.category === cause.name.toLowerCase()
                      ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                  }`}
                >
                  {cause.name}
                  <span className="ml-1 opacity-70">({cause.count})</span>
                </button>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}