import json
import os
import re

def parse_price(price_str):
    if not price_str or price_str == 'nan':
        return 1.0
    price_str = price_str.upper()
    match_cr = re.search(r'([\d\.]+)\s*CR', price_str)
    if match_cr:
        return float(match_cr.group(1))
    match_l = re.search(r'([\d\.]+)\s*L', price_str)
    if match_l:
        return float(match_l.group(1)) / 100.0
    return 1.0

def generate_image_url(name):
    # Standard pattern: https://ipl-stats-sports-mechanic.s3.ap-south-1.amazonaws.com/ipl/playerimages/Player%20Name.png
    encoded_name = name.strip().replace(' ', '%20')
    return f"https://ipl-stats-sports-mechanic.s3.ap-south-1.amazonaws.com/ipl/playerimages/{encoded_name}.png"

def parse_bulk_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Split content by markdown table headers or double newlines
    # Each set starts with | Name | ...
    sets_data = {}
    
    # Simple split by | Name |
    tables = content.split('| Name             | Country      | Points | Role        | Set | Base Price |')
    if len(tables) <= 1:
        # Try a more flexible header split
        tables = re.split(r'\| Name\s+\| Country\s+\| Points\s+\| Role\s+\| Set\s+\| Base Price\s+\|', content)
        
    for table in tables:
        if not table.strip():
            continue
        
        lines = table.strip().split('\n')
        # Skip separator line if present (| --- | --- |)
        start_idx = 0
        if lines[0].strip().startswith('| ---'):
            start_idx = 1
            
        for line in lines[start_idx:]:
            cols = [c.strip() for c in line.split('|') if c.strip()]
            if len(cols) < 5:
                continue
            
            # Index mapping: Name(0), Country(1), Points(2), Role(3), Set(4), Base Price(5)
            name = cols[0]
            country = cols[1]
            points = float(cols[2]) if cols[2].replace('.','',1).isdigit() else 0.0
            role = cols[3]
            set_name = cols[4]
            base_price = parse_price(cols[5]) if len(cols) > 5 else 1.0
            
            player_obj = {
                "id": f"p_{set_name.lower()}_{len(sets_data.get(set_name, [])) + 1}",
                "name": name,
                "country": country,
                "role": role,
                "basePrice": base_price,
                "status": "available",
                "soldPrice": None,
                "team": None,
                "image": generate_image_url(name),
                "fantasyPoints": int(points * 14 * 4), # UI consistency
                "pointsPerMatch": points,
                "recentSeasons": 4, # Standard for 2021-2024 (4 seasons)
                "category": "Capped" if "U" not in set_name else "Uncapped"
            }
            
            if set_name not in sets_data:
                sets_data[set_name] = []
            sets_data[set_name].append(player_obj)
            
    valid_sets = {}
    for set_name, players in sets_data.items():
        if set_name in ['Set', '---', '----', 'SET'] or not players:
            continue
        valid_sets[set_name] = players
            
    return valid_sets

def run_save():
    input_file = r'C:\Users\varun\OneDrive\Documents\Desktop\ipl\1.txt'
    output_file = r'c:\Users\varun\OneDrive\Documents\Desktop\Vasavi\ipl_auction\data\players.json'
    
    print(f"Reading from {input_file}...")
    sets_data = parse_bulk_file(input_file)
    
    total_players = sum(len(v) for v in sets_data.values())
    print(f"Parsed {total_players} players in {len(sets_data)} sets.")
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(sets_data, f, indent=2)
    print(f"Saved to {output_file}")

if __name__ == "__main__":
    run_save()
