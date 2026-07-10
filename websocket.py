import asyncio
import json
import websockets

clients = []


def get_temperature_from_destinations(location):
    with open('destinations.json', 'r') as file:
        data = json.load(file)

    for item in data:
        if item['name'].lower() == location.lower():
            weather = item.get('weather', '')
            import re
            match = re.search(r'(\d+)', weather)
            if match:
                return int(match.group(1))
            return None
    return None


async def handle_connection(websocket):
    try:
        clients.append(websocket)

        async for raw_data in websocket:
            print(f"Received from {websocket.remote_address}: {raw_data}")
            try:
                message = json.loads(raw_data)
            except json.JSONDecodeError:
                await websocket.send(json.dumps({'error': 'Invalid JSON'}))
                continue

            location = message.get('location')
            if not location:
                await websocket.send(json.dumps({'error': 'Missing location'}))
                continue
            temperature_data = get_temperature_from_destinations(location)

            if temperature_data is not None:
                await websocket.send(json.dumps({'temperature': temperature_data}))
            else:
                await websocket.send(json.dumps({'error': 'Location not found'}))
    except Exception as e:
        print(f"Error handling connection: {e}")
    finally:
        if websocket in clients:
            clients.remove(websocket)


async def main():
    async with websockets.serve(handle_connection, '127.0.0.1', 8765):
        print("WebSocket server started on ws://127.0.0.1:8765")
        await asyncio.Future()


if __name__ == '__main__':
    asyncio.run(main())
