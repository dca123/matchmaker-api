import dota2 from 'dota2';

export const lobbyConfig = {
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
export const pinoSettings = {
  level: process.env.LOG_LEVEL || 'trace',
  prettyPrint: {
    colorize: true,
    ignore: 'pid,hostname',
    levelFirst: true,
    translateTime: 'yyyy-mm-dd HH:MM:ss.l',
  },
};
