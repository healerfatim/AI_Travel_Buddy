from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from nlp_utils import parse_travel_query

app = Flask(__name__)
CORS(app)

# --- NEW HELPERS FOR DATA PERSISTENCE (SECTION 3) ---
def load_db():
    """Load destinations from the JSON file safely"""
    try:
        base_path = os.path.dirname(os.path.abspath(__file__))
        json_path = os.path.join(base_path, 'destinations.json')
        with open(json_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading database: {e}")
        return []

def save_db(data):
    """Save updated destinations list back to the JSON file"""
    try:
        base_path = os.path.dirname(os.path.abspath(__file__))
        json_path = os.path.join(base_path, 'destinations.json')
        with open(json_path, 'w') as f:
            json.dump(data, f, indent=4)
        return True
    except Exception as e:
        print(f"Error saving database: {e}")
        return False

# --- MACHINE LEARNING LOGIC ---
def get_ml_recommendations(user_query, user_style, destinations):
    recommendations = []
    keywords = user_query.lower().split()
    
    for d in destinations:
        score = 0
        # 1. Content-Based Match (Style)
        if d.get('style', '').lower() == user_style.lower():
            score += 10 
        # 2. Correlation Match (Tags)
        for tag in d.get('tags', []):
            if tag in keywords:
                score += 5
        
        d['match_score'] = score
        recommendations.append(d)
    
    return sorted(recommendations, key=lambda x: x.get('match_score', 0), reverse=True)

# --- MAIN SEARCH ENDPOINT ---
@app.route('/api/search', methods=['GET'])
def search_api():
    query = request.args.get('q', '')
    style = request.args.get('style', 'Adventure')
    
    parsed = parse_travel_query(query)
    destinations = load_db() # Load current data from JSON
    
    all_ranked = get_ml_recommendations(query, style, destinations)
    
    if not query or query.lower() == "pakistan":
        return jsonify({"info": parsed, "results": all_ranked})

    filtered_results = []
    for d in all_ranked:
        price_match = d['cost'] <= parsed['extracted_budget']
        region_match = True
        if parsed['extracted_region'] == 'north':
            region_match = d['region'] in ['Gilgit Baltistan', 'Khyber Pakhtunkhwa', 'Punjab']
        elif parsed['extracted_region'] == 'south':
            region_match = d['region'] in ['Balochistan', 'Sindh']
            
        if price_match and region_match:
            filtered_results.append(d)
            
    return jsonify({"info": parsed, "results": filtered_results})

# --- ADMIN DASHBOARD ENDPOINTS (SECTION 3) ---

@app.route('/api/admin/stats', methods=['GET'])
def get_admin_stats():
    """Provides mock user activity data for the Admin Dashboard"""
    return jsonify({
        "total_users": 156,
        "total_searches": 2840,
        "popular_region": "North (Hunza)",
        "feedback": [
            {"user": "Ali", "comment": "The budget estimation is very helpful!"},
            {"user": "Fatima", "comment": "Can we add more places in Sindh?"},
            {"user": "Omar", "comment": "Great AI matching for adventure styles."}
        ]
    })

@app.route('/api/admin/update-destination', methods=['POST'])
def update_destination():
    """Allows Admin to add a new destination or update an existing one"""
    new_dest = request.json
    destinations = load_db()
    
    # Check if we are updating or adding
    found = False
    for i, d in enumerate(destinations):
        if d['id'] == new_dest['id']:
            destinations[i] = new_dest
            found = True
            break
            
    if not found:
        destinations.append(new_dest)
        
    if save_db(destinations):
        return jsonify({"message": "Successfully updated destination database!"})
    else:
        return jsonify({"error": "Failed to save data"}), 500

if __name__ == "__main__":
    print("--------------------------------------------------")
    print("  AI Travel Buddy PORTAL (Section 3 Admin Active) ")
    print("  Listening on: http://127.0.0.1:5000             ")
    print("--------------------------------------------------")
    app.run(debug=True, port=5000)