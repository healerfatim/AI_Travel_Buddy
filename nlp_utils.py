import re
import json

try:
    import spacy
    nlp = spacy.load("en_core_web_sm")
except (ImportError, OSError):
    nlp = None


def extract_place(query):
    if nlp is None:
        return []
    doc = nlp(query)
    return [ent.text.strip() for ent in doc.ents
            if ent.label_ == "GPE"]


def parse_travel_query(query):
    query = query.lower().replace(',', '')

    days = 3
    days_match = re.search(r'(\d+)\s*day', query)
    if days_match:
        days = int(days_match.group(1))
        query_without_days = query.replace(days_match.group(0), "")
    else:
        query_without_days = query

    budget = 100000
    budget_matches = re.findall(r'\d+', query_without_days)

    if budget_matches:
        potential_budgets = [int(n) for n in budget_matches]
        budget = max(potential_budgets)

    region_map = {
        'north': ['north', 'gilgit', 'kpk', 'naran', 'hunza', 'mountains', 'murree', 'kaghan'],
        'south': ['south', 'karachi', 'beach', 'gwadar', 'balochistan', 'ocean', 'coast']
    }

    found_region = None
    for region, keywords in region_map.items():
        if any(word in query for word in keywords):
            found_region = region
            break

    return {
        "extracted_budget": budget,
        "extracted_days": days,
        "extracted_region": found_region,
        "original_query": query
    }
