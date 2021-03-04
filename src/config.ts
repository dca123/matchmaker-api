import dota2 from 'dota2';

const lobbyConfig = {
  game_name: 'node-dota2',
  server_region: dota2.ServerRegion.USWEST,
  game_mode: dota2.schema.DOTA_GameMode.DOTA_GAMEMODE_AP,
  series_type: 2,
  game_version: 1,
  allow_cheats: false,
  fill_with_bots: true,
  allow_spectating: true,
  pass_key: 'password',
  radiant_series_wins: 0,
  dire_series_wins: 0,
  allchat: true,
};

export default lobbyConfig;
