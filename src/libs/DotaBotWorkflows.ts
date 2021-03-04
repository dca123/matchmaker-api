import DotaBot from './DotaBot';
import { Player } from './Lobby';

const bot = new DotaBot();
const sendInvite = async function (players: Player[]) {
  const steamClientOK = await bot.startSteam();
  if (steamClientOK) {
    console.log('steam ready');
    const dotaClientStatus = await bot.startDota();
    if (dotaClientStatus) {
      console.log('dota ready');
      console.log('players', players);

      await bot.createLobby();
    }
  }
};

const createLobbyWorkflow = async function (players: Player[]) {
  const steamClientOK = await bot.startSteam();
  if (steamClientOK) {
    console.log('steam ready');
    const dotaClientStatus = await bot.startDota();
    if (dotaClientStatus) {
      console.log('dota ready');
      console.log('players', players);
      bot
        .createLobby()
        .then(() => bot.invitePlayers(players))
        .then(() => bot.waitForReady(players))
        .then(() => bot.launchLobby())
        .then(() => bot.exit())
        .catch((err) => console.log(err));
    }
  }
};

export default createLobbyWorkflow;
