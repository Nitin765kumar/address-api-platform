import { useEffect, useState } from "react";
import "./App.css";

const API_BASE_URL = "http://localhost:5000/api/v1";

function App() {
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [subDistricts, setSubDistricts] = useState([]);
  const [villages, setVillages] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedSubDistrict, setSelectedSubDistrict] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load states
  useEffect(() => {
    fetch(`${API_BASE_URL}/states`)
      .then((response) => response.json())
      .then((result) => {
        if (result.success) {
          setStates(result.data);
        } else {
          setError(result.message || "Failed to load states");
        }
      })
      .catch(() => {
        setError("Failed to load states");
      });
  }, []);

  // Load districts
  const handleStateChange = async (event) => {
    const stateCode = event.target.value;

    setSelectedState(stateCode);
    setSelectedDistrict("");
    setSelectedSubDistrict("");

    setDistricts([]);
    setSubDistricts([]);
    setVillages([]);
    setSearchResults([]);
    setHasSearched(false);
    setError("");

    if (!stateCode) return;

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/districts/${stateCode}`
      );

      const result = await response.json();

      if (result.success) {
        setDistricts(result.data);
      } else {
        setError(result.message || "Failed to load districts");
      }
    } catch {
      setError("Failed to load districts");
    } finally {
      setLoading(false);
    }
  };

  // Load sub-districts
  const handleDistrictChange = async (event) => {
    const districtCode = event.target.value;

    setSelectedDistrict(districtCode);
    setSelectedSubDistrict("");

    setSubDistricts([]);
    setVillages([]);
    setSearchResults([]);
    setHasSearched(false);
    setError("");

    if (!districtCode) return;

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/subdistricts/${districtCode}`
      );

      const result = await response.json();

      if (result.success) {
        setSubDistricts(result.data);
      } else {
        setError(result.message || "Failed to load sub-districts");
      }
    } catch {
      setError("Failed to load sub-districts");
    } finally {
      setLoading(false);
    }
  };

  // Load villages
  const handleSubDistrictChange = async (event) => {
    const subDistrictCode = event.target.value;

    setSelectedSubDistrict(subDistrictCode);
    setVillages([]);
    setSearchResults([]);
    setHasSearched(false);
    setError("");

    if (!subDistrictCode) return;

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/villages/${subDistrictCode}`
      );

      const result = await response.json();

      if (result.success) {
        setVillages(result.data);
      } else {
        setError(result.message || "Failed to load villages");
      }
    } catch {
      setError("Failed to load villages");
    } finally {
      setLoading(false);
    }
  };

  // Search villages
  const handleVillageSearch = async (event) => {
    event.preventDefault();

    const query = searchQuery.trim();

    if (query.length < 2) {
      setError("Please enter at least 2 characters to search");
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    try {
      setSearchLoading(true);
      setError("");
      setSearchResults([]);
      setVillages([]);
      setHasSearched(false);

      const response = await fetch(
        `${API_BASE_URL}/villages/search?q=${encodeURIComponent(
          query
        )}&page=1&limit=20`
      );

      const result = await response.json();

      if (result.success) {
        setSearchResults(result.data || []);
        setHasSearched(true);
      } else {
        setError(result.message || "Search failed");
      }
    } catch {
      setError("Failed to search villages");
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="container">

        <header className="header">
          <h1>Address API Platform</h1>
          <p>Explore Indian address data by location</p>
        </header>

        <div className="address-card">

          <div className="field">
            <label>State / UT</label>

            <select
              value={selectedState}
              onChange={handleStateChange}
            >
              <option value="">Select State / UT</option>

              {states.map((state) => (
                <option
                  key={state.code}
                  value={state.code}
                >
                  {state.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>District</label>

            <select
              value={selectedDistrict}
              onChange={handleDistrictChange}
              disabled={!selectedState}
            >
              <option value="">Select District</option>

              {districts.map((district) => (
                <option
                  key={district.code}
                  value={district.code}
                >
                  {district.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Sub-District</label>

            <select
              value={selectedSubDistrict}
              onChange={handleSubDistrictChange}
              disabled={!selectedDistrict}
            >
              <option value="">Select Sub-District</option>

              {subDistricts.map((subDistrict) => (
                <option
                  key={subDistrict.code}
                  value={subDistrict.code}
                >
                  {subDistrict.name}
                </option>
              ))}
            </select>
          </div>

        </div>

        <div className="search-card">
          <div className="search-heading">
            <h2>Search Villages</h2>
            <p>Search from the complete village database</p>
          </div>

          <form
            onSubmit={handleVillageSearch}
            className="search-form"
          >
            <input
              type="text"
              placeholder="Enter village name..."
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
            />

            <button
              type="submit"
              disabled={searchLoading}
            >
              {searchLoading ? "Searching..." : "Search"}
            </button>
          </form>
        </div>

        {loading && (
          <p className="status">
            Loading...
          </p>
        )}

        {searchLoading && (
          <p className="status">
            Searching villages...
          </p>
        )}

        {error && (
          <p className="error">
            {error}
          </p>
        )}

        {/* Villages from selected Sub-District */}
        {villages.length > 0 && (
          <div className="results">
            <div className="results-header">
              <h2>Villages</h2>
              <span>
                {villages.length} villages
              </span>
            </div>

            <div className="village-list">
              {villages.map((village) => (
                <div
                  className="village-item"
                  key={village.code}
                >
                  <strong>
                    {village.name}
                  </strong>

                  <small>
                    Code: {village.code}
                  </small>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {hasSearched && searchResults.length > 0 && (
          <div className="results">
            <div className="results-header">
              <h2>Search Results</h2>

              <span>
                {searchResults.length} villages found
              </span>
            </div>

            <div className="village-list">
              {searchResults.map((village) => (
                <div
                  className="village-item"
                  key={village.code}
                >
                  <strong>
                    {village.name}
                  </strong>

                  <small>
                    Code: {village.code}
                    {" | "}
                    {village.subDistrict?.name}
                    {", "}
                    {village.subDistrict?.district?.name}
                    {", "}
                    {village.subDistrict?.district?.state?.name}
                  </small>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No search results */}
        {hasSearched &&
          searchResults.length === 0 &&
          !searchLoading &&
          !error && (
            <p className="status">
              No villages found for "{searchQuery}".
            </p>
          )}

        {/* No villages in selected Sub-District */}
        {!loading &&
          selectedSubDistrict &&
          villages.length === 0 &&
          !hasSearched &&
          !error && (
            <p className="status">
              No villages found.
            </p>
          )}

      </div>
    </div>
  );
}

export default App;