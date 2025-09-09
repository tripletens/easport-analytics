// components/FavoriteButton.js
import React, { useState, useEffect } from 'react';
import { isInFavorites, addToFavorites, removeFromFavorites } from '../utils/favorites';

const FavoriteButton = ({ type, item, size = 'medium' }) => {
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        setIsFavorite(isInFavorites(type, item.id));
    }, [type, item.id]);

    const handleToggleFavorite = () => {
        if (isFavorite) {
            removeFromFavorites(type, item.id);
            setIsFavorite(false);
        } else {
            addToFavorites(type, item);
            setIsFavorite(true);
        }
    };

    const sizeClasses = {
        small: 'favorite-btn-small',
        medium: 'favorite-btn-medium',
        large: 'favorite-btn-large'
    };

    return (
        <button
            className={`favorite-btn ${sizeClasses[size]} ${isFavorite ? 'favorited' : ''}`}
            onClick={handleToggleFavorite}
            title={isFavorite ? `Remove from favorites` : `Add to favorites`}
        >
            {isFavorite ? '★' : '☆'}
        </button>
    );
};

export default FavoriteButton;