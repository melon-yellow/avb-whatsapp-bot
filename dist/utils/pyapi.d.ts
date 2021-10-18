import type Bot from 'ts-wapp';
import type {
  ITarget
} from 'ts-wapp/dist/utils/types.js';
export default class PyAPI {
  bot: Bot;
  conn: boolean;
  target: ITarget;
  constructor(bot: Bot);
  get api(): import("ts-wapp/dist/utils/api").default;
  get misc(): import("ts-misc").default;
  link(): Promise < boolean > ;
  start(): Promise < boolean > ;
}
