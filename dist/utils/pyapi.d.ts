import type Bot from '../core/bot.js';
export default class PyAPI {
  bot: Bot;
  conn: boolean;
  pyaddr: string;
  constructor(bot: Bot);
  get api(): import("../core/bot.js").API;
  get misc(): import("ts-misc").default;
  link(): Promise < boolean > ;
  start(): Promise < boolean > ;
}
