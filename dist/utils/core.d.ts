import Miscellaneous from 'ts-misc';
import Venom from 'venom-bot';
import type VenomHostDevice from 'venom-bot/dist/api/model/host-device';
import type * as expressCore from 'express-serve-static-core';
import type {
  AxiosResponse
} from 'axios';
declare type TFetchString = string | Promise < string > | (() => string | Promise < string > );
interface ISent extends Venom.Message {
  readonly whapp: Whapp;
  readonly quotedMsg: ISent;
  send(msg: TFetchString, log ? : TFetchString, quoteId ? : TFetchString): Promise < ISent > ;
  quote(msg: TFetchString, log ? : TFetchString): Promise < ISent > ;
  onReply(exec: TExec): boolean;
  clean(): string;
}
interface ISentTextObj {
  to: {
    _serialized: string;
  };
}
export declare class WhappTypeGuards {
  isSentTextObj(obj: unknown): obj is ISentTextObj;
}
declare type TExec = (m: ISent) => any;
declare type TAExec = (m: ISent) => Promise < [any, Error] > ;
declare type IAPIAction = (req: expressCore.Request) => any;
declare type IAAPIAction = (req: expressCore.Request) => Promise < [any, Error] > ;
interface IAction {
  readonly name: string;
  cond ? : TAExec;
  do :TAExec;
}
export declare class Whapp {
  bot: Bot;
  me: VenomHostDevice.Me;
  replyables: Record < string, TAExec > ;
  typeGuards: WhappTypeGuards;
  constructor(bot: Bot);
  get whapp(): this;
  get misc(): Miscellaneous;
  get client(): Venom.Whatsapp;
  start(): Promise < boolean > ;
  onMessage(message: Venom.Message): Promise < any > ;
  onReply(message: ISent): Promise < [any, Error] > ;
  addReplyable(sentId: string, exec: TExec): boolean;
  fetch(data: TFetchString): Promise < string > ;
  contactsList(flag ? : number): Record < string, string > ;
  contact(to: string, flag ? : number): string;
  getMessageById(id: string): Promise < ISent > ;
  setMessage(sent: Venom.Message): ISent;
  sendText(phoneNumber: string, text: string): Promise < ISent > ;
  sendReply(phoneNumber: string, text: string, quoteId: string): Promise < ISent > ;
  send(to: TFetchString, text: TFetchString, log ? : TFetchString, quoteId ? : TFetchString): Promise < ISent > ;
  sends(to: TFetchString, text: TFetchString, log ? : TFetchString, quoteId ? : TFetchString): Promise < [ISent, Error] > ;
}
export declare class API {
  bot: Bot;
  auth: string;
  app: expressCore.Express;
  actions: Record < string, IAAPIAction > ;
  constructor(bot: Bot);
  get api(): this;
  get misc(): Miscellaneous;
  req(url: string, data: any): Promise < AxiosResponse < any >> ;
  reqs(url: string, data: any): Promise < [AxiosResponse < any > , Error] > ;
  start(): Promise < boolean > ;
  execute(req: expressCore.Request): Promise < {
    done: boolean;
    data: any;
    error ? : undefined;
  } | {
    done: boolean;
    error: any;
    data ? : undefined;
  } > ;
  add(name: string, func: IAPIAction): boolean;
}
export declare class Chat {
  bot: Bot;
  constructor(bot: Bot);
  get chat(): this;
  get misc(): Miscellaneous;
  clean(message: string | ISent, lower ? : boolean): string;
  get timeGreet(): "Bom dia 🥱" | "Bom dia" | "Boa tarde" | "Boa noite";
  get hi(): "Opa!!" | "Ola!" | "Oi!";
  get done(): "Pronto!" | "Certo!" | "Ok!";
  get gotIt(): string;
  get gotMention(): string;
  get askPython(): {
    readonly asking: string;
    readonly finally: "Veja o que eu encontrei 👇" | "Eu encontrei o seguinte 👇" | "Olha aí o que achei pra você 👇" | "Isso foi o que eu encontrei 👇" | "Olha só o que eu encontrei 👇" | "Eu encontrei isso aqui 👇";
  };
  get error(): {
    readonly network: string;
  };
}
export default class Bot {
  misc: Miscellaneous;
  client: Venom.Whatsapp;
  actions: Record < string, IAction > ;
  started: boolean;
  whapp: Whapp;
  chat: Chat;
  api: API;
  constructor();
  get bot(): this;
  log(log: string | Error): Promise < void > ;
  start(session: string): Promise < boolean > ;
  get send(): (typeof Whapp.prototype.send);
  get sends(): (typeof Whapp.prototype.sends);
  execute(message: ISent): Promise < any > ;
  add: < N extends string > (name: N, ...params: N extends 'else' ? [
    exec: TExec
  ] : [
    exec: TExec,
    success: TExec
  ]) => boolean;
}
export {};
