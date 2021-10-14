import type Bot from 'ts-wapp';
export default class PyAPI {
  bot: Bot;
  conn: boolean;
  pyaddr: string;
  constructor(bot: Bot);
  get api(): import("ts-wapp/dist/utils/api").default;
  get misc(): import("ts-misc").default;
  link(): Promise < boolean > ;
  start(): Promise < boolean > ;
}
