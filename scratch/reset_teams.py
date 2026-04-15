import json

teams_path = r'c:\Users\varun\OneDrive\Documents\Desktop\Vasavi\ipl_auction\data\teams.json'

with open(teams_path, 'r', encoding='utf-8') as f:
    teams = json.load(f)

for team in teams:
    team['budget'] = 120
    team['players'] = []

with open(teams_path, 'w', encoding='utf-8') as f:
    json.dump(teams, f, indent=2)

print("✅ Successfully reset all team budgets to 120 Cr and cleared squads.")
