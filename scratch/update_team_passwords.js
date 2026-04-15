const fs = require('fs');
const path = require('path');

const teamsPath = path.join(__dirname, '..', 'data', 'teams.json');
const teams = JSON.parse(fs.readFileSync(teamsPath, 'utf8'));

teams.forEach(team => {
    team.password = `acumen@${team.id}`;
    console.log(`Updated password for ${team.id}: ${team.password}`);
});

fs.writeFileSync(teamsPath, JSON.stringify(teams, null, 2));
console.log('✅ All team passwords updated successfully.');
