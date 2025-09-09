export const addToFavorites = (type, item) => {
    const favorites = JSON.parse(localStorage.getItem('dotaFavorites')) || {
        players: [],
        teams: [],
        heroes: [],
        matches: []
    };

    const exists = favorites[type].some(fav => fav.id === item.id);
    if (!exists) {
        favorites[type].push({
            id: item.id,
            name: item.name || item.radiant_name || item.dire_name || item.localized_name,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('dotaFavorites', JSON.stringify(favorites));
    }
    return favorites;
};

export const removeFromFavorites = (type, id) => {
    const favorites = JSON.parse(localStorage.getItem('dotaFavorites')) || {
        players: [],
        teams: [],
        heroes: [],
        matches: []
    };
    
    favorites[type] = favorites[type].filter(item => item.id !== id);
    localStorage.setItem('dotaFavorites', JSON.stringify(favorites));
    return favorites;
};

export const isInFavorites = (type, id) => {
    const favorites = JSON.parse(localStorage.getItem('dotaFavorites')) || {
        players: [],
        teams: [],
        heroes: [],
        matches: []
    };
    
    return favorites[type].some(item => item.id === id);
};