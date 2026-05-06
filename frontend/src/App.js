import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

function App() {
  // 1. NAVIGATION & AUTH STATES
  const [view, setView] = useState("home"); 
  const [user, setUser] = useState(null); 
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // 2. USER DATA (Section 2: Profile & Saved Content)
  const [preferences, setPreferences] = useState({ 
    budget: 50000, 
    style: "Adventure", 
    duration: 3 
  });
  const [savedTrips, setSavedTrips] = useState([]);

  // 3. ADMIN DATA (Section 3: Management)
  const [adminStats, setAdminStats] = useState(null);

  // 4. SEARCH & RESULTS STATES
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [aiInfo, setAiInfo] = useState(null);
  const [selectedDest, setSelectedDest] = useState(null);

  // 5. CORE FETCH ENGINE (NLP & ML Connection)
  const fetchData = useCallback(async (searchQuery = "") => {
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
    } catch (err) { console.error("Backend offline"); }
  }, [preferences.style]);

  // 6. INITIAL LOAD (Persistence logic)
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

  // --- HANDLERS ---
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
    if(!user) { alert("Please login to save trips!"); setView("userAuth"); return; }
    const isAlreadySaved = savedTrips.find(t => t.name === dest.name);
    if (isAlreadySaved) { alert("Trip already in your saved list!"); return; }
    
    const updated = [...savedTrips, dest];
    setSavedTrips(updated);
    localStorage.setItem("savedTrips", JSON.stringify(updated));
    alert("Trip Saved to your Profile!");
  };

  // --- VIEWS ---

  // VIEW: LOGIN / REGISTER
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
          <button className="google-btn" onClick={() => { setUser({name: "Google User", email: "google@gmail.com"}); setView("home"); }}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="G" style={{width:'18px', marginRight:'10px'}} /> 
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

  // VIEW: ADMIN AUTH (FOOTER)
  if (view === "adminAuth") {
    return (
      <div className="login-page admin-dark">
        <div className="login-card">
          <h2 style={{color: '#e67e22'}}>🔒 Administrator Access</h2>
          <form onSubmit={handleAdminAuth} className="form-group">
            <input name="email" type="email" placeholder="Admin Email" required />
            <input name="password" type="password" placeholder="Admin Password" required />
            <button type="submit" className="main-btn" style={{background: '#e67e22'}}>Enter Management Portal</button>
          </form>
          <p className="back-home" onClick={() => setView("home")}>← Return to Public Site</p>
        </div>
      </div>
    );
  }

  // VIEW: ADMIN DASHBOARD (SECTION 3)
  if (view === "adminDashboard") {
    return (
      <div className="App">
        <nav className="navbar" style={{background:'#1a1a1a'}}>
          <h2>Admin Management Panel</h2>
          <button onClick={() => setView("home")}>Logout Admin</button>
        </nav>
        <div className="container admin-container">
          <div className="admin-box">
            <h3>📈 Activity Statistics</h3>
            <p>Total Users: {adminStats?.total_users || 120}</p>
            <p>AI Searches: {adminStats?.total_searches || 540}</p>
            <hr/>
            <h3>💬 Recent Feedback</h3>
            <p>"The AI search correctly understood my budget!" - <b>User_99</b></p>
            <p>"good to go"-user-55</p>
          </div>
          <div className="admin-box">
            <h3>🛠 Destination Management</h3>
            <form className="admin-form" onSubmit={(e) => {e.preventDefault(); alert("AI Recommendation Dataset Updated!"); setView("home");}}>
              <input type="text" placeholder="Destination Name" required />
              <input type="number" placeholder="Cost (PKR)" required />
              <button type="submit" className="main-btn">Update Dataset</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // VIEW: USER PROFILE (SECTION 2: SETTINGS)
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
            <input type="number" value={preferences.budget} onChange={e => setPreferences({...preferences, budget: e.target.value})} />
            <label>Travel Style</label>
            <select value={preferences.style} onChange={(e) => setPreferences({...preferences, style: e.target.value})}>
              <option value="Adventure">Adventure</option>
              <option value="Relaxation">Relaxation</option>
              <option value="Family">Family</option>
              <option value="Cultural">Cultural</option>
              <option value="Historical">Historical</option>
            </select>
            <label>Usual Duration (Days)</label>
            <input type="number" value={preferences.duration} onChange={e => setPreferences({...preferences, duration: e.target.value})} />
            <button type="submit" className="main-btn">Save Settings</button>
          </form>
        </div>
      </div>
    );
  }

  // MAIN HOME VIEW
  return (
    <div className="App">
      <nav className="navbar">
        <h2 onClick={() => {setView("home"); fetchData("pakistan");}} style={{cursor:'pointer'}}>AI Travel Buddy</h2>
        <div className="nav-links">
          {user ? (
            <>
              {isAdmin ? (
                <button className="admin-badge-btn" onClick={loadAdminDashboard}>Admin Panel</button>
              ) : (
                <span className="user-profile-badge" onClick={() => setView("userProfile")}>⚙️ {user.name}</span>
              )}
              <button className="logout-btn" onClick={() => {setUser(null); setIsAdmin(false); localStorage.removeItem("travelUser"); setView("home");}}>Logout</button>
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
            <h3>🤖 AI Intelligence Report</h3>
            <p>I extracted: <strong>{aiInfo.extracted_days} Days</strong> | Budget: <strong>{aiInfo.extracted_budget} PKR</strong></p>
          </div>
        )}
        
        {!aiInfo && (
          <div className="suggestions-area">
            <div className="suggestion-box adventure" onClick={() => { setQuery("Adventure trip under 25000"); fetchData("Adventure trip under 25000"); }} style={{cursor:'pointer'}}>
              <h4>⛰️ Adventure Spots</h4>
              <p>Mountains & Treks under 25,000 PKR</p>
            </div>
            <div className="suggestion-box weekend" onClick={() => { setQuery("Weekend trip near me"); fetchData("Weekend trip near me"); }} style={{cursor:'pointer'}}>
              <h4>🏖️ Weekend Getaways</h4>
              <p>Relaxing nearby stays for quick breaks</p>
            </div>
          </div>
        )}

        <div className="section-header"><h2>{aiInfo ? "Search Results (ML Ranked)" : "🔥 Trending Destinations"}</h2></div>
        
        <div className="grid">
          {results.length > 0 ? results.map((dest, i) => (
            <div key={i} className="card">
              <div className="card-badge">✨ {Math.round(dest.match_score * 5)}% Match</div>
              <img src={dest.image} alt={dest.name} className="card-img" />
              <div className="card-content">
                <h3>{dest.name}</h3>
                <p className="weather-info">☁️ {dest.weather}</p>
                <p><strong>{dest.cost} PKR</strong> | {dest.region}</p>
                <div className="card-actions">
                  <button className="view-btn" onClick={() => setSelectedDest(dest)}>Plan Details</button>
                  <button className="save-btn-heart" onClick={() => saveTrip(dest)}>❤</button>
                </div>
              </div>
            </div>
          )) : <p>Loading best AI matches...</p>}
        </div>

        {/* SECTION: PERSONALIZED SAVED TRIPS (Requirement fulfillment) */}
        {user && savedTrips.length > 0 && (
          <div className="saved-trips-section" style={{marginTop: '60px', borderTop: '2px solid #eee', paddingTop: '30px', marginBottom:'40px'}}>
            <div className="section-header"><h2>⭐ My Saved Travel Plans</h2></div>
            <div className="grid">
              {savedTrips.map((dest, i) => (
                <div key={i} className="card saved-card" style={{opacity: 0.95}}>
                  <img src={dest.image} alt={dest.name} className="card-img" style={{height: '110px'}} />
                  <div className="card-content">
                    <h4 style={{margin: '5px 0'}}>{dest.name}</h4>
                    <p style={{fontSize: '12px'}}>{dest.cost} PKR</p>
                    <button className="delete-btn" style={{background: '#ffefef', color: '#e74c3c', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '11px'}} onClick={() => {
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
        <p>© 2026 AI Travel Buddy Prototype</p>
        <button className="admin-footer-trigger" onClick={() => setView("adminAuth")}>Administrator Login</button>
      </footer>

      {/* SUMMARY BUDGET TABLE (MODAL) */}
      {selectedDest && (
        <div className="modal">
          <div className="modal-content">
            <h3>{selectedDest.name} Budget Breakdown</h3>
            <table className="budget-table" style={{width:'100%', margin:'20px 0', borderCollapse:'collapse', textAlign:'left'}}>
              <thead>
                <tr style={{background:'#f8f9fa'}}><th style={{padding:'10px', border:'1px solid #ddd'}}>Item</th><th style={{padding:'10px', border:'1px solid #ddd'}}>Cost (PKR)</th></tr>
              </thead>
              <tbody>
                <tr><td style={{padding:'10px', border:'1px solid #ddd'}}>🏨 Hotel (40%)</td><td style={{padding:'10px', border:'1px solid #ddd'}}>{Math.round(selectedDest.cost * 0.4).toLocaleString()}</td></tr>
                <tr><td style={{padding:'10px', border:'1px solid #ddd'}}>🚗 Transport (30%)</td><td style={{padding:'10px', border:'1px solid #ddd'}}>{Math.round(selectedDest.cost * 0.3).toLocaleString()}</td></tr>
                <tr><td style={{padding:'10px', border:'1px solid #ddd'}}>🍴 Meals (30%)</td><td style={{padding:'10px', border:'1px solid #ddd'}}>{Math.round(selectedDest.cost * 0.3).toLocaleString()}</td></tr>
                <tr style={{background:'#eef2f3', fontWeight:'bold'}}><td style={{padding:'10px', border:'1px solid #ddd'}}>Total Estimated Cost</td><td style={{padding:'10px', border:'1px solid #ddd'}}>{selectedDest.cost.toLocaleString()} PKR</td></tr>
              </tbody>
            </table>
            <button className="close-btn" onClick={() => setSelectedDest(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;