import Miscellaneous from 'ts-misc';
import Whapp from './whapp.js';
import type * as W from './whapp.js';
import type * as expressCore from 'express-serve-static-core';
import type {
  AxiosResponse
} from 'axios';
export declare type TExec = (m: W.ISent) => any;
export declare type TAExec = (m: W.ISent) => Promise < [any, Error] > ;
export declare type IAPIAction = (req: expressCore.Request) => any;
export declare type IAAPIAction = (req: expressCore.Request) => Promise < [any, Error] > ;
export interface IAction {
  readonly name: string;
  cond ? : TAExec;
  do :TAExec;
}
export declare class API {
  bot: Bot;
  auth: string;
  app: expressCore.Express;
  actions: Record < string, IAAPIAction > ;
  constructor(bot: Bot);
  get api(): this;
  get misc(): Miscellaneous;
  get axios(): import("axios").AxiosStatic;
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
  clean(message: string | W.ISent, lower ? : boolean): string;
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
  execute(message: W.ISent): Promise < any > ;
  add: < N extends string > (name: N, ...params: N extends 'else' ? [
    exec: TExec
  ] : [
    exec: TExec,
    success: TExec
  ]) => boolean;
}
