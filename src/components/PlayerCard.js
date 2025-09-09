import React from 'react';

const PlayerCard = ({ player }) => {
  if (!player || !player.profile) {
    return <div>Loading player data...</div>;
  }

  const { profile, win, lose, mmr_estimate, rank_tier } = player;
  const winRate = ((win / (win + lose)) * 100).toFixed(2);

  return (
    <div className="player-card">
      <img src={profile.avatarfull} alt={`${profile.personaname}'s avatar`} />
      <h2>{profile.personaname}</h2>
      <p><strong>Win/Loss:</strong> {win} / {lose}</p>
      <p><strong>Win Rate:</strong> {winRate}%</p>
      <p><strong>Estimated MMR:</strong> {mmr_estimate?.estimate || 'N/A'}</p>
      <p><strong>Rank Tier:</strong> {rank_tier ? `${Math.floor(rank_tier / 10)} Div ${rank_tier % 10}` : 'N/A'}</p>
    </div>
  );
};

export default PlayerCard;