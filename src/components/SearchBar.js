import React from 'react';

const SearchBar = ({ searchQuery, setSearchQuery, handleSearch, loading, onClear }) => {
  return (
    <form onSubmit={handleSearch} className="search-form">
      <div className="search-input-container">
        <input
          type="text"
          placeholder="Search for a Dota 2 player by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={loading}
          className="search-input"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={onClear}
            className="clear-search-btn"
            disabled={loading}
          >
            ×
          </button>
        )}
      </div>
      <button type="submit" disabled={loading} className="search-btn">
        {loading ? 'Searching...' : 'Search'}
      </button>
    </form>
  );
};

export default SearchBar;