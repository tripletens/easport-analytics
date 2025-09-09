import axios from 'axios';

const opendotaAPI = axios.create({
    baseURL: 'https://api.opendota.com/api/',
});

export const searchPlayers = async (playerName) => {
    try {
        const response = await opendotaAPI.get(`search?q=${playerName}`);
        return response.data;
    } catch (error) {
        console.error('Error searching players:', error);
        throw error; 
    }
};

export const getPlayerData = async (accountId) => {
    try {
        const response = await opendotaAPI.get(`players/${accountId}?select=profile,mmr_estimate,competitive_rank,rank_tier,solo_competitive_rank,leaderboard_rank,win,lose`);
        return response.data;
    } catch (error) {
        console.error('Error fetching player data:', error);
        throw error;
    }
};

export const getPlayerMatches = async (accountId, limit = 10) => {
    try {
        const response = await opendotaAPI.get(`players/${accountId}/matches?limit=${limit}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching player matches:', error);
        throw error;
    }
};

export const getProMatches = async (limit = 10) => {
    try {
        const response = await opendotaAPI.get(`proMatches?limit=${limit}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching pro matches:', error);
        throw error;
    }
};

export const getProPlayers = async () => {
    try {
        const response = await opendotaAPI.get('proPlayers');
        return response.data;
    } catch (error) {
        console.error('Error fetching pro players:', error);
        throw error;
    }
};

export const getPlayerWinLoss = async (accountId) => {
    try {
        const response = await opendotaAPI.get(`players/${accountId}/wl`);
        return response.data;
    } catch (error) {
        console.error('Error fetching player win/loss:', error);
        throw error;
    }
};

export const getProTeams = async () => {
    try {
        const response = await opendotaAPI.get('teams');
        return response.data;
    } catch (error) {
        console.error('Error fetching pro teams:', error);
        throw error;
    }
};

export const getTeamData = async (teamId) => {
    try {
        const response = await opendotaAPI.get(`teams/${teamId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching team data:', error);
        throw error;
    }
};

export const getTeamPlayers = async (teamId) => {
    try {
        const response = await opendotaAPI.get(`teams/${teamId}/players`);
        return response.data;
    } catch (error) {
        console.error('Error fetching team players:', error);
        throw error;
    }
};

export const getTeamMatches = async (teamId, limit = 10) => {
    try {
        const response = await opendotaAPI.get(`teams/${teamId}/matches?limit=${limit}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching team matches:', error);
        throw error;
    }
};

export const getTeamHeroes = async (teamId) => {
    try {
        const response = await opendotaAPI.get(`teams/${teamId}/heroes`);
        return response.data;
    } catch (error) {
        console.error('Error fetching team heroes:', error);
        throw error;
    }
};

export const getPublicMatches = async (limit = 10) => {
    try {
        const response = await opendotaAPI.get(`publicMatches?limit=${limit}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching public matches:', error);
        throw error;
    }
};

export const getMatchDetails = async (matchId) => {
    try {
        const response = await opendotaAPI.get(`matches/${matchId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching match details:', error);
        throw error;
    }
};

export const getHeroStats = async () => {
    try {
        const response = await opendotaAPI.get('heroStats');
        return response.data;
    } catch (error) {
        console.error('Error fetching hero stats:', error);
        throw error;
    }
};

// export const getPlayerData = async (accountId) => {
//   try {
//     // The OpenDota API returns player data directly, not nested under 'profile'
//     const response = await opendotaAPI.get(`players/${accountId}`);
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching player data:', error);
//     throw error;
//   }
// };

