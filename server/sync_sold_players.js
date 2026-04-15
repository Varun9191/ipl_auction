const { readData, writeData, initCache } = require('./dataManager');

async function sync() {
    console.log('🔄 Starting data synchronization for sold players...');
    await initCache();

    const playersData = readData('players.json');
    const teams = readData('teams.json');

    if (!playersData || !teams) {
        console.error('❌ Failed to load players or teams data.');
        return;
    }

    // Create a flat map of players for easy lookup
    const playersMap = {};
    for (const setId in playersData) {
        playersData[setId].forEach(p => {
            playersMap[p.id] = p;
        });
    }

    let updatedCount = 0;

    // Update each team's players
    for (const team of teams) {
        console.log(`Checking team: ${team.name}...`);
        for (const player of team.players) {
            const originalPlayer = playersMap[player.id];
            if (originalPlayer) {
                // Check if fields are missing or 0
                if (player.fantasyPoints === undefined || player.pointsPerMatch === undefined || player.recentSeasons === undefined) {
                    player.fantasyPoints = originalPlayer.fantasyPoints;
                    player.pointsPerMatch = originalPlayer.pointsPerMatch;
                    player.recentSeasons = originalPlayer.recentSeasons;
                    updatedCount++;
                    console.log(`   ✅ Updated stats for ${player.name}`);
                }
            } else {
                console.warn(`   ⚠️ Could not find original data for ${player.name} (id: ${player.id})`);
            }
        }
    }

    if (updatedCount > 0) {
        await writeData('teams.json', teams);
        console.log(`\n🎉 Success! Updated ${updatedCount} players across all teams.`);
    } else {
        console.log('\n✨ No updates needed. All sold players already have point data.');
    }

    process.exit(0);
}

sync().catch(err => {
    console.error('❌ Sync failed:', err);
    process.exit(1);
});
