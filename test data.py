import json

def test_json_loading():
    try:
        # 1. Open the file
        with open('destinations.json', 'r') as file:
            # 2. Convert JSON text into a Python List
            data = json.load(file)
            
        print("--- SUCCESS: Data Loaded Successfully ---")
        print(f"Total Destinations Found: {len(data)}\n")

        # 3. Loop through and print specific parts of the data
        for destination in data:
            name = destination['name']
            cost = destination['cost']
            activities = ", ".join(destination['activities']) # Turns list into a string
            
            print(f"📍 Destination: {name}")
            print(f"💰 Cost: {cost} PKR")
            print(f"🏃 Activities: {activities}")
            print("-" * 30)

    except FileNotFoundError:
        print("❌ ERROR: 'destinations.json' file not found in this folder.")
    except json.JSONDecodeError:
        print("❌ ERROR: Your JSON file has a syntax mistake (check for missing commas or quotes).")
    except Exception as e:
        print(f"❌ AN UNEXPECTED ERROR OCCURRED: {e}")

# Run the test
if __name__ == "__main__":
    test_json_loading()