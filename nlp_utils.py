import re

def parse_travel_query(query):
    # Standardize the query to lowercase
    query = query.lower().replace(',', '')
    
    # 1. Extract Days FIRST (to avoid confusing it with budget)
    # Looks for "3 day", "3day", "3-day", "3 days"
    days = 3  # Default value
    days_match = re.search(r'(\d+)\s*day', query)
    if days_match:
        days = int(days_match.group(1))
        # Remove the days part from the query so it doesn't get picked up as budget
        query_without_days = query.replace(days_match.group(0), "")
    else:
        query_without_days = query

    # 2. Extract Budget (looking for a larger number in the remaining text)
    # We look for any number that is 1000 or more, or simply the remaining number
    budget = 100000  # Default high budget
    budget_matches = re.findall(r'\d+', query_without_days)
    
    if budget_matches:
        # Convert all found numbers to integers
        potential_budgets = [int(n) for n in budget_matches]
        # Usually, the largest remaining number is the budget
        budget = max(potential_budgets)
    
    # 3. Extract Region Keywords
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