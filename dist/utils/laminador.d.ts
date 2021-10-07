import type Bot from '../core/bot.js';
export default class Laminador {
  bot: Bot;
  constructor(bot: Bot);
  get misc(): import("ts-misc").default;
  getData(url: string): Promise < any > ;
  postData(quest: Record < string, any > ): Promise < string > ;
  getProd(): Promise < string > ;
  getProdMes(): Promise < string > ;
  getTref(): Promise < string > ;
}
