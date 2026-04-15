import json
import os
import re

def parse_markdown_table(table_str):
    lines = table_str.strip().split('\n')
    if len(lines) < 3:
        return []
    
    headers = [h.strip() for h in lines[0].split('|') if h.strip()]
    rows = []
    for line in lines[2:]:
        cols = [c.strip() for c in line.split('|') if c.strip()]
        if len(cols) == len(headers):
            rows.append(dict(zip(headers, cols)))
    return rows

def generate_image_url(name):
    # Standard pattern: https://ipl-stats-sports-mechanic.s3.ap-south-1.amazonaws.com/ipl/playerimages/Player%20Name.png
    encoded_name = name.replace(' ', '%20')
    return f"https://ipl-stats-sports-mechanic.s3.ap-south-1.amazonaws.com/ipl/playerimages/{encoded_name}.png"

def update_players_json(set_name, players_data, file_path):
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            try:
                full_data = json.load(f)
            except:
                full_data = {}
    else:
        full_data = {}

    new_players = []
    for i, p in enumerate(players_data):
        # Format Base Price: "2 Cr" -> 2.0
        price_str = p.get('Base Price', '1').split(' ')[0]
        try:
            base_price = float(price_str)
        except:
            base_price = 1.0
            
        # Format Pts: 55.26
        try:
            pts = float(p.get('Points', 0))
        except:
            pts = 0.0

        player_obj = {
            "id": f"p_{set_name.lower()}_{i+1}",
            "name": p['Name'],
            "country": p['Country'],
            "role": p['Role'],
            "basePrice": base_price,
            "status": "available",
            "soldPrice": None,
            "team": None,
            "image": generate_image_url(p['Name']),
            "fantasyPoints": int(pts * 14 * 4), # Estimating total points for UI consistency
            "pointsPerMatch": pts,
            "category": "Capped" if "Capped" in p.get('Category', 'Capped') else "Uncapped"
        }
        new_players.append(player_obj)
    
    full_data[set_name] = new_players
    
    with open(file_path, 'w') as f:
        json.dump(full_data, f, indent=2)
    print(f"DONE: Successfully updated Set {set_name} in players.json")

# Input data from user
m1_table = """
| Name             | Country      | Points | Role        | Set | Base Price |
| ---------------- | ------------ | ------ | ----------- | --- | ---------- |
| Suryakumar Yadav | India        | 55.26  | Batter      | M1  | 2 Cr       |
| Andre Russell    | West Indies  | 55.48  | All-Rounder | M1  | 2 Cr       |
| Shubman Gill     | India        | 54.88  | Batter      | M1  | 2 Cr       |
| Jos Buttler      | England      | 60.38  | WK-Batter   | M1  | 2 Cr       |
| Ravindra Jadeja  | India        | 51.59  | All-Rounder | M1  | 2 Cr       |
| Mitchell Starc   | Australia    | 45.79  | Bowler      | M1  | 2 Cr       |
| Sanju Samson     | India        | 52.12  | WK-Batter   | M1  | 2 Cr       |
| Shreyas Iyer     | India        | 47.81  | Batter      | M1  | 2 Cr       |
| Rashid Khan      | Afghanistan  | 48.46  | Bowler      | M1  | 2 Cr       |
| Rishabh Pant     | India        | 46.05  | WK-Batter   | M1  | 2 Cr       |
| Arshdeep Singh   | India        | 38.66  | Bowler      | M1  | 1 Cr       |
| Rohit Sharma     | India        | 38.94  | Batter      | M1  | 2 Cr       |
| Glenn Maxwell    | Australia    | 49.12  | All-Rounder | M1  | 2 Cr       |
| Kagiso Rabada    | South Africa | 39.04  | Bowler      | M1  | 2 Cr       |
"""

players_path = r'c:\Users\varun\OneDrive\Documents\Desktop\Vasavi\ipl_auction\data\players.json'

# FOR THE FIRST SET, WE CLEAR THE PREVIOUS DATA
with open(players_path, 'w') as f:
    json.dump({}, f)

parsed_data = parse_markdown_table(m1_table)
update_players_json('M1', parsed_data, players_path)
