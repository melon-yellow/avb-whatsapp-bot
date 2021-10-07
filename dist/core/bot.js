/*
##########################################################################################################################
#                                                        AVBOT CORE                                                      #
##########################################################################################################################
*/
// Import Miscellaneous
import Miscellaneous from 'ts-misc';
// Import Whapp
import Whapp from './whapp.js';
// Import Express
import express from 'express';
import basicAuth from 'express-basic-auth';
import requestIp from 'request-ip';
// Import General Modules
import axios from 'axios';
/*
##########################################################################################################################
#                                                    MISCELLANEOUS CLASS                                                 #
##########################################################################################################################
*/
// New Miscellaneous Object
const misc = new Miscellaneous();
const is = misc.guards.is;
/*
##########################################################################################################################
#                                                           API CLASS                                                    #
##########################################################################################################################
*/
// API Class
export class API {
  constructor(bot) {
    Object.defineProperty(this, 'bot', {
      get() {
        return bot;
      }
    });
    // Interface Actions Object
    this.actions = {};
    // Set Authentication
    this.auth = 'ert2tyt3tQ3423rubu99ibasid8hya8da76sd';
    // Define App
    this.app = express();
    this.app.use(basicAuth({
      users: {
        bot: this.auth
      }
    }));
    this.app.use(express.json());
    // Set Bot Interface
    this.app.post('/bot', async (req, res) => {
      // Execute Functionality
      const response = await this.api.execute(req);
      // Send Response
      res.send(JSON.stringify(this.misc.sets.serialize(response)));
    });
  }
  /*
  ##########################################################################################################################
  #                                                          API METHODS                                                   #
  ##########################################################################################################################
  */
  // Cycle Reference
  get api() {
    return this;
  }
  get misc() {
    return this.bot.misc;
  }
  // Request
  async req(url, data) {
    return axios.post(url, this.misc.sets.serialize(data), {
      auth: {
        username: 'bot',
        password: this.auth
      }
    });
  }
  // Safe Request
  async reqs(url, data) {
    const req = this.misc.handle.safe(this.req, this);
    return req(url, data);
  }
  // Start Interface App
  async start() {
    try {
      // listen on port 1615
      this.app.listen(1615);
      // if error occurred
    } catch {
      return false;
    }
    // return success
    return true;
  }
  /*
  ##########################################################################################################################
  #                                                    API EXECUTION METHODS                                               #
  ##########################################################################################################################
  */
  // Interface Execute Bot Command
  async execute(req) {
    let action;
    try {
      // check request
      if (!is.object(req))
        throw new Error('bad request');
      if (!is.object(req.body))
        throw new Error('bad request');
      if (!is.in(req.body, 'action'))
        throw new Error('key "action" missing in request');
      if (!is.string(req.body.action))
        throw new Error('key "action" must be a string');
      if (req.body.action.length === 0)
        throw new Error('key "action" not valid');
      if (!is.in(this.actions, req.body.action))
        throw new Error('action not found');
      // update reference
      action = req.body.action;
      // log action to be executed
      const ip = requestIp.getClientIp(req).replace('::ffff:', '');
      await this.bot.log(`Exec(api::${action}) From(${ip})`);
      // execute action
      const [data, actionError] = await this.actions[action](req);
      // throw action error
      if (actionError)
        throw actionError;
      // resolve with data
      return {
        done: true,
        data: data
      };
      // if error occurred
    } catch (error) {
      // log error
      if (action)
        await this.bot.log(`Throw(api::${action}) Catch(${error})`);
      // reject with error
      return {
        done: false,
        error: error
      };
    }
  }
  // Add Bot Interface Action
  add(name, func) {
    if (!is.function(func))
      return false;
    if (!is.string(name))
      return false;
    if (name.length === 0)
      return false;
    this.actions[name] = this.misc.handle.safe(func);
    return true;
  }
}
/*
##########################################################################################################################
#                                                         CHAT CLASS                                                     #
##########################################################################################################################
*/
// Defines Chat Object
export class Chat {
  constructor(bot) {
    Object.defineProperty(this, 'bot', {
      get() {
        return bot;
      }
    });
  }
  // Cycle Reference
  get chat() {
    return this;
  }
  get misc() {
    return this.bot.misc;
  }
  // Clean Message
  clean(message, lower = true) {
    let str = '';
    if (is.string(message))
      str = message;
    else
      str = message.body;
    str = lower ? str.toLowerCase() : str;
    str = str.replace(`@${this.bot.whapp.me.user}`, '');
    while (str.includes('  '))
      str = str.replace('  ', ' ');
    str = str.trim();
    str = str.normalize('NFD');
    str = str.replace(/[\u0300-\u036f]/g, '');
    return str;
  }
  /*
  ##########################################################################################################################
  #                                                       CHAT GETTERS                                                     #
  ##########################################################################################################################
  */
  get timeGreet() {
    const h = new Date().getHours();
    const g = {
      6: 'Bom dia 🥱',
      12: 'Bom dia',
      18: 'Boa tarde',
      24: 'Boa noite'
    };
    for (const i in g) {
      if (h < Number(i)) {
        return g[i];
      }
    }
  }
  get hi() {
    return this.misc.sets.rand(['Opa!!', 'Ola!', 'Oi!']);
  }
  get done() {
    return this.misc.sets.rand(['Pronto!', 'Certo!', 'Ok!']);
  }
  get gotIt() {
    const hi = this.misc.sets.rand([this.chat.hi, this.chat.hi, '']);
    const git = this.misc.sets.rand(['é pra já! 👍', 'entendido! 👍', 'Ok! 👍',
      'como desejar! 👍', 'deixa comigo! 👍', 'pode deixar! 👍'
    ]);
    // Assembly
    return hi + (hi === '' ? '' : ' ') + this.timeGreet + ', ' + git;
  }
  get gotMention() {
    const ack = this.misc.sets.rand(['🙋‍♂️', '😁']);
    const me = this.misc.sets.rand(['Eu', 'Aqui']);
    // Assembly
    return ack + ' ' + me;
  }
  get askPython() {
    const chat = this;
    const misc = this.misc;
    return {
      get asking() {
        const hi = misc.sets.rand([chat.hi, chat.hi, '']);
        const wait = misc.sets.rand([
          ', certo', ', espera um pouquinho', '',
          ', só um momento', ', Ok', ', um instante'
        ]);
        const lure = misc.sets.rand([
          'vou verificar o que você está querendo 🤔',
          'vou analisar melhor o que você pediu 🤔',
          'vou analisar aqui o que você está querendo 🤔',
          'vou procurar aqui o que você pediu 🤔'
        ]);
        // Assembly
        return hi + (hi === '' ? '' : ' ') + chat.timeGreet + wait + ', ' + lure;
      },
      get finally() {
        return misc.sets.rand([
          'Veja o que eu encontrei 👇', 'Eu encontrei o seguinte 👇',
          'Olha aí o que achei pra você 👇', 'Isso foi o que eu encontrei 👇',
          'Olha só o que eu encontrei 👇', 'Eu encontrei isso aqui 👇'
        ]);
      }
    };
  }
  get error() {
    const misc = this.misc;
    return {
      get network() {
        const msg = misc.sets.rand(['Ocorreu um erro enquanto eu buscava os dados!',
          'Oops, algo deu Errado!', 'Não pude acessar os dados!'
        ]);
        const flt = misc.sets.rand(['🤔 deve ter algum sistema fora do ar',
          '🤔 meus servidores devem estar offline',
          '🤔 deve ter caido alguma conexão minha'
        ]);
        // Assembly
        return msg + ' ' + flt;
      }
    };
  }
}
/*
##########################################################################################################################
#                                                         BOT CLASS                                                      #
##########################################################################################################################
*/
// Bot Class
export default class Bot {
  constructor() {
    // Add Bot Action
    this.add = (name, exec, success) => {
      // Check inputs
      if (!is.function(exec))
        return false;
      if (success && !is.function(success))
        return false;
      if (!is.string(name))
        return false;
      if (name.length === 0)
        return false;
      // Execute Action
      let action;
      action = {
        name: name,
        cond: this.misc.handle.safe(exec),
        do: this.misc.handle.safe(success)
      };
      if (name === 'else') {
        action = {
          name: name,
          do: this.misc.handle.safe(exec)
        };
      }
      this.actions[name] = action;
      return true;
    };
    // Get Miscellaneous Methods
    this.misc = misc;
    // Bot Properties
    this.started = false;
    // Set Lists
    this.actions = {};
    // Nest Objects
    this.whapp = new Whapp(this);
    this.chat = new Chat(this);
    this.api = new API(this);
    // Add else Method to Bot
    this.bot.add('else', msg => null);
    // Add send_msg Action
    this.api.add('send_msg', async (req) => {
      // fix parameters
      const to = req.body.to || 'anthony';
      const text = req.body.text || 'empty message';
      const log = req.body.log || 'api::send_msg';
      const quoteId = req.body.quote_id || null;
      const replyUrl = req.body.reply_url || null;
      // send message
      const [sent, sendMessageError] = await this.bot.sends(to, text, log, quoteId);
      // if not done prevent execution
      if (sendMessageError)
        throw sendMessageError;
      // set default reply action
      sent.onReply(async (message) => {
        const json = {
          action: 'on_reply',
          msg_id: sent.id,
          reply: message
        };
        const [data, onReplyError] = await this.api.reqs(replyUrl, json);
        if (onReplyError)
          throw onReplyError;
        return data;
      });
      // return message
      return sent;
    });
    // Add get_message Action
    this.api.add('get_message', async (req) => {
      if (!is.in(req.body, 'id'))
        throw new Error('key "id" missing in request');
      if (!is.string(req.body.id))
        throw new Error('key "id" must be a string');
      if (req.body.id.length === 0)
        throw new Error('key "id" not valid');
      return this.whapp.getMessageById(req.body.id);
    });
    // Add host_device Action
    this.api.add('host_device', async (req) => this.whapp.client.getHostDevice());
  }
  /*
  ##########################################################################################################################
  #                                                      BOT METHODS                                                       #
  ##########################################################################################################################
  */
  // Cycle Reference
  get bot() {
    return this;
  }
  // Saves Log
  async log(log) {
    // Structure
    const t = this.misc.sync.timestamp();
    console.log(`(${t}) ${log}`);
  }
  /*
  ##########################################################################################################################
  #                                                      START METHOD                                                      #
  ##########################################################################################################################
  */
  // Start App
  async start(session) {
    // Start Whapp Services
    this.bot.started = await this.whapp.start(session);
    if (!this.bot.started)
      return false;
    // Log Start of Bot
    await this.bot.log('Avbot::Started');
    // Send Message to Admin
    await this.bot.sends('anthony', 'Node Avbot Started!', 'bot_start');
    // Start Interface App
    await this.bot.api.start();
    // return status
    return this.bot.started;
  }
  /*
  ##########################################################################################################################
  #                                                       SEND MESSAGE                                                     #
  ##########################################################################################################################
  */
  // Send Message Method
  get send() {
    return this.whapp.send.bind(this.whapp);
  }
  get sends() {
    return this.whapp.sends.bind(this.whapp);
  }
  /*
  ##########################################################################################################################
  #                                                     EXECUTION METHODS                                                  #
  ##########################################################################################################################
  */
  // Execute Bot Command
  async execute(message) {
    // set initial
    let actionName;
    const logAction = (action) => {
      actionName = action.name;
      return this.bot.log(`Exec(bot::${action.name}) From(${message.from})`);
    };
    try {
      // Check All Action Conditions
      for (const action of Object.values(this.bot.actions)) {
        if (action.cond && action.name !== 'else') {
          const [cond, condError] = await action.cond(message);
          if (cond && !condError) {
            await logAction(action);
            const [data, actionError] = await action.do(message);
            if (actionError)
              throw actionError;
            else
              return data;
          }
        }
      }
      // do Else
      const elseAction = this.bot.actions.else;
      await logAction(elseAction);
      const [data, actionError] = await elseAction.do(message);
      if (actionError)
        throw actionError;
      else
        return data;
      // if error occurred
    } catch (error) {
      // log error
      await this.bot.log(`Throw(bot::${actionName}) Catch(${error})`);
    }
  }
}
/*
##########################################################################################################################
#                                                         END                                                            #
##########################################################################################################################
*/
