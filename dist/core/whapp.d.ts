import Venom from 'venom-bot';
import type VenomHostDevice from 'venom-bot/dist/api/model/host-device';
import type Bot from './bot.js';
import type {
  TExec,
  TAExec
} from './bot.js';
export declare type TFetchString = string | Promise < string > | (() => string | Promise < string > );
export interface ISent extends Venom.Message {
  readonly whapp: Whapp;
  readonly quotedMsg: ISent;
  send(msg: TFetchString, log ? : TFetchString, quoteId ? : TFetchString): Promise < ISent > ;
  quote(msg: TFetchString, log ? : TFetchString): Promise < ISent > ;
  onReply(exec: TExec): boolean;
  clean(): string;
}
export interface ISentTextObj {
  to: {
    _serialized: string;
  };
}
export declare class WhappTypeGuards {
  bot: Bot;
  constructor(bot: Bot);
  isSentTextObj(obj: unknown): obj is ISentTextObj;
}
export default class Whapp {
  bot: Bot;
  client: Venom.Whatsapp;
  me: VenomHostDevice.Me;
  replyables: Record < string, TAExec > ;
  typeGuards: WhappTypeGuards;
  constructor(bot: Bot);
  get whapp(): this;
  get misc(): import("ts-misc").default;
  start(session: string): Promise < boolean > ;
  onMessage(message: Venom.Message): Promise < any > ;
  onReply(message: ISent): Promise < [any, Error] > ;
  addReplyable(sentId: string, exec: TExec): boolean;
  fetch(data: TFetchString): Promise < string > ;
  contactsList(flag ? : number): Record < string, string > ;
  contact(to: string, flag ? : number): string;
  getMessageById(id: string): Promise < ISent > ;
  setMessage(sent: Venom.Message): ISent;
  sendText(to: string, text: string): Promise < ISent > ;
  sendReply(to: string, text: string, quoteId: string): Promise < ISent > ;
  send(to: TFetchString, text: TFetchString, log ? : TFetchString, quoteId ? : TFetchString): Promise < ISent > ;
  sends(to: TFetchString, text: TFetchString, log ? : TFetchString, quoteId ? : TFetchString): Promise < [ISent, Error] > ;
}
