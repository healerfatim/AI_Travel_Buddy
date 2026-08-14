from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from nlp_utils import parse_travel_query

app = Flask(__name__)
CORS(app)

BASE_PATH = os.path.dirname(os.path.abspath(__file__))
SEED_PATH = os.path.join(BASE_PATH, 'destinations.json')

DB_ENGINE = "JSON"
pg_conn = None
tinydb_db = None
DestQuery = None
TinydbQuery = None

# ---- TRY POSTGRESQL FIRST ----
try:
    import psycopg2
    import psycopg2.extras
    pg_host = os.getenv("PG_HOST", "localhost")
    pg_port = int(os.getenv("PG_PORT", 5432))
    pg_user = os.getenv("PG_USER", "postgres")
    pg_pass = os.getenv("PG_PASS")
    pg_db = os.getenv("PG_DB", "travel_buddy")
    if not pg_pass:
        raise RuntimeError("PG_PASS environment variable must be set")
    admin_conn = psycopg2.connect(host=pg_host, port=pg_port, dbname="postgres", user=pg_user, password=pg_pass, connect_timeout=3)
    admin_conn.autocommit = True
    cur = admin_conn.cursor()
    cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (pg_db,))
    if not cur.fetchone():
        from psycopg2 import sql
        cur.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(pg_db)))
        print(f"Created database '{pg_db}'")
    cur.close()
    admin_conn.close()

    pg_conn = psycopg2.connect(host=pg_host, port=pg_port, dbname=pg_db, user=pg_user, password=pg_pass, connect_timeout=3)
    pg_conn.autocommit = True
    cur = pg_conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS destinations (
            id INTEGER PRIMARY KEY,
            name TEXT,
            type TEXT,
            style TEXT,
            region TEXT,
            cost INTEGER,
            weather TEXT,
            best_season TEXT,
            activities JSONB DEFAULT '[]',
            tags JSONB DEFAULT '[]',
            safety_rating INTEGER DEFAULT 3,
            user_rating REAL DEFAULT 0,
            image TEXT DEFAULT '/images/default.jpg',
            description TEXT DEFAULT ''
        );
    """)
    cur.execute("SELECT COUNT(*) FROM destinations")
    count = cur.fetchone()[0]
    if count == 0:
        with open(SEED_PATH, 'r') as f:
            data = json.load(f)
        for d in data:
            d.setdefault('description', '')
            d.setdefault('user_rating', 0)
            d.setdefault('safety_rating', 3)
            cur.execute("""
                INSERT INTO destinations (id, name, type, style, region, cost, weather, best_season,
                    activities, tags, safety_rating, user_rating, image, description)
                VALUES (%(id)s, %(name)s, %(type)s, %(style)s, %(region)s, %(cost)s, %(weather)s, %(best_season)s,
                    %(activities)s::jsonb, %(tags)s::jsonb, %(safety_rating)s, %(user_rating)s, %(image)s, %(description)s)
            """, {k: json.dumps(v) if isinstance(v, list) else v for k, v in d.items()})
        print(f"Seeded {len(data)} destinations into PostgreSQL")
    cur.close()
    DB_ENGINE = "PostgreSQL"
    print("PostgreSQL connected successfully")
except Exception as e:
    print(f"PostgreSQL not available: {e}")
    pg_conn = None

# ---- FALLBACK TO TINYDB ----
if pg_conn is None:
    try:
        from tinydb import TinyDB, Query as TinydbQuery
        tinydb_path = os.path.join(BASE_PATH, 'tinydb.json')
        tinydb_db = TinyDB(tinydb_path)
        DestQuery = TinydbQuery()
        if len(tinydb_db) == 0:
            with open(SEED_PATH, 'r') as f:
                data = json.load(f)
            if data:
                tinydb_db.insert_multiple(data)
                print(f"Seeded {len(data)} destinations into TinyDB")
        DB_ENGINE = "TinyDB"
        print("TinyDB connected successfully")
    except Exception as e:
        print(f"TinyDB not available: {e}")

# ---- DATABASE ABSTRACTION LAYER ----
def pg_fetch_all():
    cur = pg_conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT * FROM destinations ORDER BY id")
    rows = cur.fetchall()
    cur.close()
    return [dict(r) for r in rows]

def pg_fetch_by_id(dest_id):
    cur = pg_conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT * FROM destinations WHERE id = %s", (dest_id,))
    row = cur.fetchone()
    cur.close()
    return dict(row) if row else None

def pg_search_by_name(name):
    cur = pg_conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT * FROM destinations WHERE LOWER(name) = LOWER(%s)", (name,))
    row = cur.fetchone()
    cur.close()
    return dict(row) if row else None

def pg_insert(d):
    cur = pg_conn.cursor()
    cur.execute("""
        INSERT INTO destinations (id, name, type, style, region, cost, weather, best_season,
            activities, tags, safety_rating, user_rating, image, description)
        VALUES (%(id)s, %(name)s, %(type)s, %(style)s, %(region)s, %(cost)s, %(weather)s, %(best_season)s,
            %(activities)s::jsonb, %(tags)s::jsonb, %(safety_rating)s, %(user_rating)s, %(image)s, %(description)s)
    """, {k: json.dumps(v) if isinstance(v, list) else v for k, v in d.items()})
    cur.close()

def pg_update(d):
    cur = pg_conn.cursor()
    cur.execute("""
        UPDATE destinations SET name=%(name)s, type=%(type)s, style=%(style)s, region=%(region)s,
            cost=%(cost)s, weather=%(weather)s, best_season=%(best_season)s,
            activities=%(activities)s::jsonb, tags=%(tags)s::jsonb,
            safety_rating=%(safety_rating)s, user_rating=%(user_rating)s, image=%(image)s, description=%(description)s
        WHERE id = %(id)s
    """, {k: json.dumps(v) if isinstance(v, list) else v for k, v in d.items()})
    cur.close()

def pg_max_id():
    cur = pg_conn.cursor()
    cur.execute("SELECT COALESCE(MAX(id), 0) FROM destinations")
    val = cur.fetchone()[0]
    cur.close()
    return val

def load_all():
    if pg_conn:
        return pg_fetch_all()
    if tinydb_db:
        return tinydb_db.all()
    with open(SEED_PATH, 'r') as f:
        return json.load(f)

def load_by_id(dest_id):
    if pg_conn:
        return pg_fetch_by_id(dest_id)
    if tinydb_db:
        result = tinydb_db.search(DestQuery.id == dest_id)
        return result[0] if result else None
    data = json.load(open(SEED_PATH))
    return next((d for d in data if d['id'] == dest_id), None)

def search_by_name(name):
    if pg_conn:
        return pg_search_by_name(name)
    if tinydb_db:
        result = tinydb_db.search(DestQuery.name.matches(f'(?i)^{name}$'))
        return result[0] if result else None
    data = json.load(open(SEED_PATH))
    return next((d for d in data if d['name'].lower() == name.lower()), None)

def insert_doc(d):
    if pg_conn:
        pg_insert(d)
    elif tinydb_db:
        tinydb_db.insert(d)
    else:
        data = json.load(open(SEED_PATH))
        data.append(d)
        with open(SEED_PATH, 'w') as f:
            json.dump(data, f, indent=4)

def update_doc(d):
    if pg_conn:
        pg_update(d)
    elif tinydb_db:
        tinydb_db.update(d, DestQuery.id == d['id'])
    else:
        data = json.load(open(SEED_PATH))
        for i, item in enumerate(data):
            if item['id'] == d['id']:
                data[i] = d
                break
        with open(SEED_PATH, 'w') as f:
            json.dump(data, f, indent=4)

def get_next_id():
    if pg_conn:
        return pg_max_id() + 1
    if tinydb_db:
        all_docs = tinydb_db.all()
        return max((d.get('id', 0) for d in all_docs), default=0) + 1
    data = json.load(open(SEED_PATH))
    return max((d.get('id', 0) for d in data), default=0) + 1

# ---- ENDPOINTS ----
@app.route('/api/get_destinations')
def get_all_destinations():
    destination_id = request.args.get('destination_id')
    if destination_id is None:
        return jsonify(load_all())
    else:
        doc = load_by_id(int(destination_id))
        return jsonify([doc] if doc else [])

@app.route('/api/get_budget_breakdown')
def get_budget_breakdown():
    query = request.args.get('query', '')
    destination = search_by_name(query)
    if destination is None:
        return jsonify({'error': 'Destination not found'}), 404

    days_raw = request.args.get('days')
    try:
        days = int(days_raw)
    except (TypeError, ValueError):
        return jsonify({'error': 'Invalid days parameter'}), 400
    if days <= 0:
        return jsonify({'error': 'days must be a positive integer'}), 400

    budget_per_day = (destination.get('cost') or 0) / days
    return jsonify({day: budget_per_day for day in range(days)})

def get_ml_recommendations(user_query, user_style, destinations):
    recommendations = []
    keywords = user_query.lower().split()
    for d in destinations:
        score = 0
        if d.get('style', '').lower() == user_style.lower():
            score += 10
        for tag in d.get('tags', []):
            if tag in keywords:
                score += 5
        rec = dict(d)
        rec['match_score'] = score
        recommendations.append(rec)
    return sorted(recommendations, key=lambda x: x.get('match_score', 0), reverse=True)

@app.route('/api/search', methods=['GET'])
def search_api():
    query = request.args.get('q', '')
    style = request.args.get('style', 'Adventure')
    parsed = parse_travel_query(query)
    destinations = load_all()
    all_ranked = get_ml_recommendations(query, style, destinations)
    if not query:
        return jsonify({"info": parsed, "results": all_ranked})
    filtered_results = []
    for d in all_ranked:
        price_match = (d.get('cost') or 0) <= parsed['extracted_budget']
        region_match = True
        dest_region = d.get('region') or ''
        if parsed['extracted_region'] == 'north':
            region_match = dest_region in ['Gilgit Baltistan', 'Khyber Pakhtunkhwa', 'Punjab']
        elif parsed['extracted_region'] == 'south':
            region_match = dest_region in ['Balochistan', 'Sindh']
        if price_match and region_match:
            filtered_results.append(d)
    return jsonify({"info": parsed, "results": filtered_results})

@app.route('/api/admin/stats', methods=['GET'])
def get_admin_stats():
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
    new_dest = request.get_json(silent=True) or {}
    defaults = {
        'name': 'Unnamed Destination',
        'type': new_dest.get('type') or new_dest.get('style') or 'Adventure',
        'style': new_dest.get('style') or new_dest.get('type') or 'Adventure',
        'region': 'Punjab',
        'cost': 10000,
        'weather': 'Moderate',
        'best_season': 'All Year',
        'activities': [],
        'tags': [],
        'safety_rating': 3,
        'user_rating': 0,
        'image': '/images/default.jpg',
        'description': ''
    }
    for key, value in defaults.items():
        if key not in new_dest or new_dest[key] is None or new_dest[key] == '':
            new_dest[key] = value
    if isinstance(new_dest.get('activities'), str):
        new_dest['activities'] = [a.strip() for a in new_dest['activities'].split(',') if a.strip()]
    if isinstance(new_dest.get('tags'), str):
        new_dest['tags'] = [t.strip().lower() for t in new_dest['tags'].split(',') if t.strip()]
    try:
        new_dest['cost'] = int(new_dest['cost'])
    except (ValueError, TypeError):
        new_dest['cost'] = 10000
    try:
        new_dest['safety_rating'] = int(new_dest['safety_rating'])
    except (ValueError, TypeError):
        new_dest['safety_rating'] = 3
    try:
        new_dest['user_rating'] = float(new_dest['user_rating'])
    except (ValueError, TypeError):
        new_dest['user_rating'] = 0
    if 'id' not in new_dest or not new_dest['id']:
        new_dest['id'] = get_next_id()
        insert_doc(new_dest)
        return jsonify({"message": "Successfully added new destination!", "destination": new_dest})
    existing = load_by_id(new_dest['id'])
    if existing is None:
        return jsonify({"error": f"Destination with ID {new_dest['id']} not found."}), 404
    update_doc(new_dest)
    return jsonify({"message": "Successfully updated destination!", "destination": new_dest})

if __name__ == "__main__":
    print("--------------------------------------------------")
    print(f"  AI Travel Buddy PORTAL (Database: {DB_ENGINE})")
    print("  Listening on: http://127.0.0.1:5000             ")
    print("--------------------------------------------------")
    app.run(debug=True, port=5000)
