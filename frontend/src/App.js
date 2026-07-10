import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

const App = () => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [view, setView] = useState("home");
  const [preferences, setPreferences] = useState({
    budget: 50000,
    style: "Adventure",
    duration: 3
  });
  const [savedTrips, setSavedTrips] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [aiInfo, setAiInfo] = useState(null);
  const [selectedDest, setSelectedDest] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async (searchQuery = "") => {
    setLoading(true);
    try {
      const url = `http://127.0.0.1:5000/api/search?q=${searchQuery}&style=${preferences.style}`;
      const response = await fetch(url);
      const data = await response.json();
      setResults(data.results || []);

      if (searchQuery && searchQuery.toLowerCase() !== "pakistan") {
        setAiInfo(data.info);
      } else {
        setAiInfo(null);
      }
    } catch (err) {
      console.error("Backend offline");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [preferences.style]);

  useEffect(() => {
    const loggedUser = localStorage.getItem("travelUser");
    const storedPrefs = localStorage.getItem("userPrefs");
    const storedTrips = localStorage.getItem("savedTrips");

    if (loggedUser) {
      const parsed = JSON.parse(loggedUser);
      setUser(parsed);
      if (parsed.email === "admin@travel.com") setIsAdmin(true);
    }

    if (storedPrefs) setPreferences(JSON.parse(storedPrefs));
    if (storedTrips) setSavedTrips(JSON.parse(storedTrips));

    fetchData("pakistan");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUserAuth = (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const name = isRegistering ? e.target.fullname.value : "Traveler";
    const userData = { name, email };
    setUser(userData);
    localStorage.setItem("travelUser", JSON.stringify(userData));
    setView("home");
  };

  const handleAdminAuth = (e) => {
    e.preventDefault();
    if (e.target.email.value === "admin@travel.com" && e.target.password.value === "admin123") {
      setIsAdmin(true);
      setUser({ name: "Admin", email: "admin@travel.com" });
      loadAdminDashboard();
    } else { alert("Invalid Admin Credentials"); }
  };

  const loadAdminDashboard = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/admin/stats`);
      const data = await res.json();
      setAdminStats(data);
      setView("adminDashboard");
    } catch (e) { alert("Admin API unreachable"); }
  };

  const saveTrip = (dest) => {
    if (!user) { alert("Please login to save trips!"); setView("userAuth"); return; }
    const isAlreadySaved = savedTrips.find(t => t.name === dest.name);
    if (isAlreadySaved) { alert("Trip already in your saved list!"); return; }

    const updated = [...savedTrips, dest];
    setSavedTrips(updated);
    localStorage.setItem("savedTrips", JSON.stringify(updated));
    alert("Trip Saved to your Profile!");
  };

  if (view === "userAuth") {
    return (
      <div className="login-page">
        <div className="login-card">
          <h2>{isRegistering ? "Create User Account" : "User Login"}</h2>
          <form onSubmit={handleUserAuth} className="form-group">
            {isRegistering && <input name="fullname" type="text" placeholder="Full Name" required />}
            <input name="email" type="email" placeholder="Email Address" required />
            <input name="password" type="password" placeholder="Password" required />
            <button type="submit" className="main-btn">{isRegistering ? "Register" : "Login"}</button>
          </form>
          <div className="divider"><span>OR</span></div>
          <button className="google-btn" onClick={() => { setUser({ name: "Google User", email: "google@gmail.com" }); setView("home"); }}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="G" style={{ width: '18px', marginRight: '10px' }} />
            Sign in with Google
          </button>
          <p className="toggle-text" onClick={() => setIsRegistering(!isRegistering)}>
            {isRegistering ? "Back to Login" : "New user? Register here"}
          </p>
          <p className="back-home" onClick={() => setView("home")}>← Back to Home</p>
        </div>
      </div>
    );
  }

  if (view === "adminAuth") {
    return (
      <div className="login-page admin-dark">
        <div className="login-card">
          <h2 style={{ color: '#e67e22' }}>Administrator Access</h2>
          <form onSubmit={handleAdminAuth} className="form-group">
            <input name="email" type="email" placeholder="Admin Email" required />
            <input name="password" type="password" placeholder="Admin Password" required />
            <button type="submit" className="main-btn" style={{ background: '#e67e22' }}>Enter Management Portal</button>
          </form>
          <p className="back-home" onClick={() => setView("home")}>← Return to Public Site</p>
        </div>
      </div>
    );
  }

  if (view === "adminDashboard") {
    const handleAddDestination = async (e) => {
      e.preventDefault();
      const form = e.target;
      const payload = {
        name: form.destName.value,
        cost: parseInt(form.destCost.value) || 10000,
        region: form.destRegion.value,
        style: form.destStyle.value,
        type: form.destStyle.value,
        weather: form.destWeather.value,
        best_season: form.destSeason.value,
        activities: form.destActivities.value,
        tags: form.destTags.value,
        safety_rating: parseInt(form.destSafety.value) || 3,
        description: form.destDescription.value,
        image: form.destImage.value || '/images/default.jpg'
      };

      try {
        const res = await fetch('http://127.0.0.1:5000/api/admin/update-destination', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
          alert(`Success: ${data.message}\nDestination "${payload.name}" saved to database.`);
          form.reset();
        } else {
          alert(`Error: ${data.error}`);
        }
      } catch (err) {
        alert("Could not reach backend. Make sure Flask server is running.");
      }
    };

    return (
      <div className="App">
        <nav className="navbar" style={{ background: '#1a1a1a' }}>
          <h2>Admin Management Panel</h2>
          <button onClick={() => setView("home")}>Logout Admin</button>
        </nav>
        <div className="container admin-container">
          <div className="admin-box">
            <h3>Activity Statistics</h3>
            <p>Total Users: {adminStats?.total_users || 120}</p>
            <p>AI Searches: {adminStats?.total_searches || 540}</p>
            <hr />
            <h3>Recent Feedback</h3>
            {adminStats?.feedback ? adminStats.feedback.map((fb, i) => (
              <p key={i}>"{fb.comment}" - <b>{fb.user}</b></p>
            )) : (
              <>
                <p>"The AI search correctly understood my budget!" - <b>User_99</b></p>
                <p>"good to go" - <b>user-55</b></p>
              </>
            )}
          </div>
          <div className="admin-box" style={{ flex: 2 }}>
            <h3>Add / Update Destination</h3>
            <form className="admin-form" onSubmit={handleAddDestination}>
              <div className="admin-form-grid">
                <div className="admin-field">
                  <label>Destination Name *</label>
                  <input name="destName" type="text" placeholder="e.g. Skardu Valley" required />
                </div>
                <div className="admin-field">
                  <label>Cost (PKR) *</label>
                  <input name="destCost" type="number" placeholder="e.g. 25000" required />
                </div>
                <div className="admin-field">
                  <label>Region *</label>
                  <select name="destRegion" required>
                    <option value="Gilgit Baltistan">Gilgit Baltistan</option>
                    <option value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa</option>
                    <option value="Punjab">Punjab</option>
                    <option value="Sindh">Sindh</option>
                    <option value="Balochistan">Balochistan</option>
                    <option value="Azad Kashmir">Azad Kashmir</option>
                  </select>
                </div>
                <div className="admin-field">
                  <label>Travel Style *</label>
                  <select name="destStyle" required>
                    <option value="Adventure">Adventure</option>
                    <option value="Relaxation">Relaxation</option>
                    <option value="Family">Family</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Historical">Historical</option>
                  </select>
                </div>
                <div className="admin-field">
                  <label>Weather</label>
                  <input name="destWeather" type="text" placeholder="e.g. Cold (8C)" />
                </div>
                <div className="admin-field">
                  <label>Best Season</label>
                  <select name="destSeason">
                    <option value="All Year">All Year</option>
                    <option value="Summer">Summer</option>
                    <option value="Winter">Winter</option>
                    <option value="Spring">Spring</option>
                    <option value="Autumn">Autumn</option>
                  </select>
                </div>
                <div className="admin-field">
                  <label>Activities (comma-separated)</label>
                  <input name="destActivities" type="text" placeholder="e.g. Hiking, Camping, Photography" />
                </div>
                <div className="admin-field">
                  <label>Tags (comma-separated)</label>
                  <input name="destTags" type="text" placeholder="e.g. nature, mountains, adventure" />
                </div>
                <div className="admin-field">
                  <label>Safety Rating (1-5)</label>
                  <select name="destSafety">
                    <option value="5">5 - Very Safe</option>
                    <option value="4">4 - Safe</option>
                    <option value="3">3 - Moderate</option>
                    <option value="2">2 - Caution</option>
                    <option value="1">1 - Risky</option>
                  </select>
                </div>
                <div className="admin-field">
                  <label>Image URL</label>
                  <input name="destImage" type="text" placeholder="/images/destination.jpg" />
                </div>
                <div className="admin-field full-width">
                  <label>Description</label>
                  <textarea name="destDescription" rows="3" placeholder="Brief description of the destination..."></textarea>
                </div>
              </div>
              <button type="submit" className="main-btn" style={{ marginTop: '15px', width: '100%' }}>Save Destination to Database</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (view === "userProfile") {
    return (
      <div className="App">
        <nav className="navbar"><h2>Travel Preferences</h2><button onClick={() => setView("home")}>Back</button></nav>
        <div className="container profile-card-large">
          <form className="preferences-form" onSubmit={(e) => {
            e.preventDefault();
            localStorage.setItem("userPrefs", JSON.stringify(preferences));
            alert("Preferences Saved Successfully!");
            setView("home");
            fetchData("pakistan");
          }}>
            <label>Trip Budget (PKR)</label>
            <input type="number" value={preferences.budget} onChange={e => setPreferences({ ...preferences, budget: e.target.value })} />
            <label>Travel Style</label>
            <select value={preferences.style} onChange={(e) => setPreferences({ ...preferences, style: e.target.value })}>
              <option value="Adventure">Adventure</option>
              <option value="Relaxation">Relaxation</option>
              <option value="Family">Family</option>
              <option value="Cultural">Cultural</option>
              <option value="Historical">Historical</option>
            </select>
            <label>Usual Duration (Days)</label>
            <input type="number" value={preferences.duration} onChange={e => setPreferences({ ...preferences, duration: e.target.value })} />
            <button type="submit" className="main-btn">Save Settings</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <nav className="navbar">
        <h2 onClick={() => { setView("home"); fetchData("pakistan"); }} style={{ cursor: 'pointer' }}>AI Travel Buddy</h2>
        <div className="nav-links">
          {user ? (
            <>
              {isAdmin ? (
                <button className="admin-badge-btn" onClick={loadAdminDashboard}>Admin Panel</button>
              ) : (
                <span className="user-profile-badge" onClick={() => setView("userProfile")}>Settings {user.name}</span>
              )}
              <button className="logout-btn" onClick={() => { setUser(null); setIsAdmin(false); localStorage.removeItem("travelUser"); setView("home"); }}>Logout</button>
            </>
          ) : (
            <button className="login-btn" onClick={() => setView("userAuth")}>Login / Register</button>
          )}
        </div>
      </nav>

      <header className="hero">
        <h1>Your Intelligent Trip Companion</h1>
        <form onSubmit={(e) => { e.preventDefault(); fetchData(query); }} className="search-bar">
          <input type="text" placeholder="e.g. 3-day trip in north under 30000" value={query} onChange={e => setQuery(e.target.value)} />
          <button type="submit">AI Search</button>
        </form>
      </header>

      <main className="container">
        {aiInfo && (
          <div className="ai-insight">
            <h3>AI Intelligence Report</h3>
            <p>I extracted: <strong>{aiInfo.extracted_days} Days</strong> | Budget: <strong>{aiInfo.extracted_budget} PKR</strong></p>
          </div>
        )}

        {!aiInfo && (
          <div className="suggestions-area">
            <div className="suggestion-box adventure" onClick={() => { setQuery("Adventure trip under 25000"); fetchData("Adventure trip under 25000"); }} style={{ cursor: 'pointer' }}>
              <h4>Adventure Spots</h4>
              <p>Mountains & Treks under 25,000 PKR</p>
            </div>
            <div className="suggestion-box weekend" onClick={() => { setQuery("Weekend trip near me"); fetchData("Weekend trip near me"); }} style={{ cursor: 'pointer' }}>
              <h4>Weekend Getaways</h4>
              <p>Relaxing nearby stays for quick breaks</p>
            </div>
          </div>
        )}

        <div className="section-header"><h2>{aiInfo ? "Search Results (ML Ranked)" : "Trending Destinations"}</h2></div>

        <div className="grid">
          {loading ? (
            <p>Loading best AI matches...</p>
          ) : results.length > 0 ? results.map((dest, i) => (
            <div key={i} className="card">
              <div className="card-badge">{Math.round(dest.match_score * 5)}% Match</div>
              <img src={dest.image} alt={dest.name} className="card-img" />
              <div className="card-content">
                <h3>{dest.name}</h3>
                <p className="weather-info">Weather: {dest.weather}</p>
                <p><strong>{dest.cost} PKR</strong> | {dest.region}</p>
                <div className="card-actions">
                  <button className="view-btn" onClick={() => setSelectedDest(dest)}>Plan Details</button>
                  <button className="save-btn-heart" onClick={() => saveTrip(dest)}>Save</button>
                </div>
              </div>
            </div>
          )) : <p>No destinations found. Try a different search.</p>}
        </div>

        {user && savedTrips.length > 0 && (
          <div className="saved-trips-section" style={{ marginTop: '60px', borderTop: '2px solid #eee', paddingTop: '30px', marginBottom: '40px' }}>
            <div className="section-header"><h2>My Saved Travel Plans</h2></div>
            <div className="grid">
              {savedTrips.map((dest, i) => (
                <div key={i} className="card saved-card" style={{ opacity: 0.95 }}>
                  <img src={dest.image} alt={dest.name} className="card-img" style={{ height: '110px' }} />
                  <div className="card-content">
                    <h4 style={{ margin: '5px 0' }}>{dest.name}</h4>
                    <p style={{ fontSize: '12px' }}>{dest.cost} PKR</p>
                    <button className="delete-btn" style={{ background: '#ffefef', color: '#e74c3c', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '11px' }} onClick={() => {
                      const filtered = savedTrips.filter((_, idx) => idx !== i);
                      setSavedTrips(filtered);
                      localStorage.setItem("savedTrips", JSON.stringify(filtered));
                    }}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>2026 AI Travel Buddy Prototype</p>
        <button className="admin-footer-trigger" onClick={() => setView("adminAuth")}>Administrator Login</button>
      </footer>

      {selectedDest && (
        <div className="modal">
          <div className="modal-content wide-modal">
            <div className="modal-header">
              <h2>Your Travel Plan: {selectedDest.name}</h2>
              <button className="close-btn" onClick={() => setSelectedDest(null)}>&times;</button>
            </div>

            {null}
            <div className="plan-summary-cards">
              <div className="summary-card query-card">
                <h4>Your Query</h4>
                <p className="query-text">"{aiInfo?.original_query || 'General trip'}"</p>
              </div>
              <div className="summary-card budget-card">
                <h4>Total Budget</h4>
                <p className="budget-number">{(aiInfo?.extracted_budget || preferences.budget).toLocaleString()} PKR</p>
              </div>
              <div className="summary-card days-card">
                <h4>Duration</h4>
                <p className="days-number">{aiInfo?.extracted_days || preferences.duration} Days</p>
              </div>
              <div className="summary-card daily-card">
                <h4>Per Day Budget</h4>
                <p className="daily-number">{Math.round((aiInfo?.extracted_budget || preferences.budget) / (aiInfo?.extracted_days || preferences.duration)).toLocaleString()} PKR</p>
              </div>
            </div>

            {}
            <div className="budget-compare-section">
              <h3>Destination Feasibility</h3>
              <div className="compare-bar">
                <div className="compare-item">
                  <span className="compare-label">Destination daily cost</span>
                  <span className="compare-value">{selectedDest.cost.toLocaleString()} PKR</span>
                </div>
                <div className="compare-item">
                  <span className="compare-label">Your daily budget</span>
                  <span className="compare-value">{Math.round((aiInfo?.extracted_budget || preferences.budget) / (aiInfo?.extracted_days || preferences.duration)).toLocaleString()} PKR</span>
                </div>
              </div>
              <div className="feasibility-result">
                {(() => {
                  const dailyBudget = (aiInfo?.extracted_budget || preferences.budget) / (aiInfo?.extracted_days || preferences.duration);
                  const totalBudget = aiInfo?.extracted_budget || preferences.budget;
                  const destDaily = selectedDest.cost;
                  const affordableDays = Math.floor(totalBudget / destDaily);
                  const isAffordable = dailyBudget >= destDaily;
                  return (
                    <>
                      <div className={`feasibility-badge ${isAffordable ? 'affordable' : 'tight'}`}>
                        {isAffordable ? 'Within Budget' : 'Over Budget'}
                      </div>
                      <p className="feasibility-text">
                        {isAffordable
                          ? `Great! You can stay up to ${affordableDays} days at ${selectedDest.name} with your budget.`
                          : `Your daily budget is ${Math.round(dailyBudget).toLocaleString()} PKR but ${selectedDest.name} costs ${selectedDest.cost.toLocaleString()} PKR per day. You could stay ${affordableDays > 0 ? affordableDays + ' day(s) ' : 'less than a day '}with this budget.`}
                      </p>
                    </>
                  );
                })()}
              </div>
            </div>

            {}
            <div className="itinerary-section">
              <h3>Day-by-Day Itinerary</h3>
              <table className="itinerary-table">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Activity</th>
                    <th>Hotel (40%)</th>
                    <th>Transport (30%)</th>
                    <th>Meals (30%)</th>
                    <th>Day Total</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: aiInfo?.extracted_days || preferences.duration || 3 }, (_, i) => {
                    const dayNum = i + 1;
                    const activities = selectedDest.activities || [];
                    const activity = activities[i % activities.length];
                    const hotel = Math.round(selectedDest.cost * 0.4);
                    const transport = Math.round(selectedDest.cost * 0.3);
                    const meals = Math.round(selectedDest.cost * 0.3);
                    const dayTotal = hotel + transport + meals;
                    return (
                      <tr key={i}>
                        <td className="day-cell">Day {dayNum}</td>
                        <td className="activity-cell">{activity || 'Explore ' + selectedDest.name}</td>
                        <td>{hotel.toLocaleString()} PKR</td>
                        <td>{transport.toLocaleString()} PKR</td>
                        <td>{meals.toLocaleString()} PKR</td>
                        <td className="total-cell">{dayTotal.toLocaleString()} PKR</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="2"><strong>Total Trip Cost</strong></td>
                    <td><strong>{(Math.round(selectedDest.cost * 0.4) * (aiInfo?.extracted_days || preferences.duration || 3)).toLocaleString()} PKR</strong></td>
                    <td><strong>{(Math.round(selectedDest.cost * 0.3) * (aiInfo?.extracted_days || preferences.duration || 3)).toLocaleString()} PKR</strong></td>
                    <td><strong>{(Math.round(selectedDest.cost * 0.3) * (aiInfo?.extracted_days || preferences.duration || 3)).toLocaleString()} PKR</strong></td>
                    <td><strong>{(selectedDest.cost * (aiInfo?.extracted_days || preferences.duration || 3)).toLocaleString()} PKR</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {}
            <div className="budget-allocation-section">
              <h3>Budget Allocation</h3>
              <div className="allocation-bars">
                <div className="bar-item">
                  <span className="bar-label">Hotel (40%)</span>
                  <div className="bar-track">
                    <div className="bar-fill hotel-bar" style={{ width: '40%' }}></div>
                  </div>
                  <span className="bar-value">{Math.round(selectedDest.cost * 0.4).toLocaleString()} PKR/day</span>
                </div>
                <div className="bar-item">
                  <span className="bar-label">Transport (30%)</span>
                  <div className="bar-track">
                    <div className="bar-fill transport-bar" style={{ width: '30%' }}></div>
                  </div>
                  <span className="bar-value">{Math.round(selectedDest.cost * 0.3).toLocaleString()} PKR/day</span>
                </div>
                <div className="bar-item">
                  <span className="bar-label">Meals (30%)</span>
                  <div className="bar-track">
                    <div className="bar-fill meals-bar" style={{ width: '30%' }}></div>
                  </div>
                  <span className="bar-value">{Math.round(selectedDest.cost * 0.3).toLocaleString()} PKR/day</span>
                </div>
              </div>
            </div>

            <button className="main-btn close-modal-btn" onClick={() => setSelectedDest(null)}>Close Plan</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
