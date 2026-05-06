import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def get_recommendations(user_style_pref):
    # 1. Load data
    with open('destinations.json', 'r') as f:
        destinations = json.load(f)

    # 2. Combine Type and Activities for the AI to read
    # Example: "Adventure Hiking Sightseeing"
    metadata = []
    for d in destinations:
        combined = f"{d['type']} {' '.join(d['activities'])}"
        metadata.append(combined)

    # 3. TF-IDF Vectorization (Turns words into math)
    tfidf = TfidfVectorizer(stop_words='english')
    tfidf_matrix = tfidf.fit_transform(metadata)

    # 4. Transform user input and compare
    user_vec = tfidf.transform([user_style_pref])
    cosine_sim = cosine_similarity(user_vec, tfidf_matrix).flatten()

    # 5. Add scores to destinations and sort
    for i in range(len(destinations)):
        destinations[i]['relevance_score'] = float(cosine_sim[i])

    # Sort by highest score first
    results = sorted(destinations, key=lambda x: x['relevance_score'], reverse=True)
    
    return results

if __name__ == "__main__":
    # Test it
    print(get_recommendations("I love adventure and hiking"))