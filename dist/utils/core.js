/*
##########################################################################################################################
#                                                        AVBOT CORE                                                      #
##########################################################################################################################
*/
// Import Miscellaneous
import Miscellaneous from 'ts-misc';
// Import Venom
import Venom from 'venom-bot';
// Import Express
import express from 'express';
import basicAuth from 'express-basic-auth';
import requestIp from 'request-ip';
// Import General Modules
import axios from 'axios';
// Import FS
import fs from 'fs';
/*
##########################################################################################################################
#                                                    MISCELLANEOUS CLASS                                                 #
##########################################################################################################################
*/
// New Miscellaneous Object
const misc = new Miscellaneous();
const is = misc.guards.is;
// Type Guards
export class WhappTypeGuards {
  // Check if Is Sent Text Object
  isSentTextObj(obj) {
    if (!is.object(obj))
      return false;
    else if (!is.in(obj, 'to'))
      return false;
    else if (!is.object(obj.to))
      return false;
    else if (!is.in(obj.to, '_serialized'))
      return false;
    else if (!is.string(obj.to._serialized))
      return false;
    else
      return true;
  }
}
/*
##########################################################################################################################
#                                                         WHAPP CLASS                                                    #
##########################################################################################################################
*/
export class Whapp {
  constructor(bot) {
    this.typeGuards = new WhappTypeGuards();
    Object.defineProperty(this, 'bot', {
      get() {
        return bot;
      }
    });
    // Set Replyables List
    this.replyables = {};
  }
  // Cycle Reference
  get whapp() {
    return this;
  }
  get misc() {
    return this.bot.misc;
  }
  /*
  ##########################################################################################################################
  #                                                     EXECUTION METHODS                                                  #
  ##########################################################################################################################
  */
  // Venom Client
  get client() {
    return this.bot.client;
  }
  // Start Whapp
  async start() {
    // check if bot started
    if (!this.bot.started)
      return false;
    // get host data
    const hostDevice = await this.client.getHostDevice();
    this.me = hostDevice.wid;
    // return done
    return true;
  }
  /*
  ##########################################################################################################################
  #                                                     EXECUTION METHODS                                                  #
  ##########################################################################################################################
  */
  // Get Message Method
  async onMessage(message) {
    if (!this.bot.started)
      return;
    else if (!is.object(message))
      return;
    else if (!is.in(message, 'body'))
      return;
    else if (message.from === 'status@broadcast')
      return;
    const uSent = this.setMessage(message);
    const isGroup = uSent.isGroupMsg === true;
    const ment = uSent.body.includes(`@${this.whapp.me.user}`);
    if (ment)
      await uSent.quote(this.bot.chat.gotMention, 'got_mention');
    if (is.object(uSent.quotedMsg))
      return await this.onReply(uSent);
    const data = (ment || !isGroup) ? await this.bot.execute(uSent) : null;
    return data;
  }
  // Get Reply Method
  async onReply(message) {
    if (!message.quotedMsg)
      return;
    const replyable = message.quotedMsg.id;
    if (is.in(this.whapp.replyables, replyable)) {
      return await this.whapp.replyables[replyable](message);
    }
  }
  // Add On-Reply Action
  addReplyable(sentId, exec) {
    if (!is.function(exec))
      return false;
    this.replyables[sentId] = this.misc.handle.safe(exec);
    return true;
  }
  /*
  ##########################################################################################################################
  #                                                    AUXILIARY METHODS                                                   #
  ##########################################################################################################################
  */
  // fetch data for message
  async fetch(data) {
    // Set Resolution Variable
    let resolution = null;
    // check type-of input
    if (is.string(data))
      resolution = data;
    else if (this.misc.guards.is.promise(data))
      resolution = await data;
    else if (is.function(data)) {
      const preRes = data();
      if (is.string(preRes))
        resolution = preRes;
      else if (this.misc.guards.is.promise(preRes))
        resolution = await preRes;
    }
    // check type-of output
    if (!is.string(resolution))
      resolution = null;
    // return text
    return resolution;
  }
  // get contacts list
  contactsList(flag) {
    // check if directory exists
    if (!fs.existsSync('./private')) {
      fs.mkdirSync('./private');
    }
    // check if file exists
    if (!fs.existsSync('./private/contacts.bot.json')) {
      fs.writeFileSync('./private/contacts.bot.json', '{}');
    }
    // get contacts from json
    let contacts = JSON.parse(fs.readFileSync('./private/contacts.bot.json').toString());
    // use flags
    if (flag === -1) {
      contacts = Object.entries(contacts)
        .reduce((ret, entry) => {
          const [key, value] = entry;
          ret[value] = key;
          return ret;
        }, {});
    }
    // return contacts
    return contacts;
  }
  // replace contact name
  contact(to, flag) {
    const params = [];
    let contact = `${to}`;
    if (flag)
      params.push(flag);
    const contacts = this.contactsList(...params);
    // replace cyclicaly
    while (Object.keys(contacts).includes(contact)) {
      contact = contacts[contact];
    }
    // return result
    return contact;
  }
  // Get Message By Id
  async getMessageById(id) {
    const getMessage = () => this.client.getMessageById(id);
    const checkMessage = (obj) => is.object(obj) && !obj.erro;
    const trial = this.misc.handle.repeat(getMessage.bind(this), checkMessage.bind(this));
    return new Promise(resolve => {
      trial
        .catch(error => (n => null)(error) || resolve(null))
        .then(value => resolve(this.setMessage(value)));
    });
  }
  /*
  ##########################################################################################################################
  #                                                    MESSAGE CONSTRUCTOR                                                 #
  ##########################################################################################################################
  */
  // Message Constructor
  setMessage(sent) {
    // Prevent Empty Message Objects
    if (!sent || !is.object(sent))
      return;
    // Fix Author on Private Messages
    if (!sent.isGroupMsg)
      sent.author = sent.from;
    // Allow Cyclic Reference
    const whapp = this;
    // Assign Message Properties
    const message = Object.defineProperty(Object.assign({}, sent, {
        // Whapp
        get whapp() {
          return whapp;
        },
        // Set Properties
        id: sent.id,
        body: sent.body,
        // Fix Contact Names
        from: whapp.contact(sent.from, -1),
        author: whapp.contact(sent.author, -1),
        // Fix Quoted Message Object
        quotedMsg: whapp.setMessage(sent.quotedMsgObj),
        quotedMsgObj: sent.quotedMsgObj,
        // Send Message to Chat
        async send(msg, log, quoteId) {
          return this.whapp.send(this.from, msg, log, quoteId);
        },
        // Quote Message
        async quote(msg, log) {
          return this.send(msg, log, this.id);
        },
        // Set On-Reply Action
        onReply(exec) {
          if (!is.function(exec))
            return false;
          this.whapp.addReplyable(this.id, exec);
          return true;
        },
        // Clean Message Text
        clean() {
          return this.whapp.bot.chat.clean(this.body);
        }
      }),
      // Set Getter
      'whapp', {
        get() {
          return whapp;
        }
      });
    // return Message Object
    return message;
  }
  /*
  ##########################################################################################################################
  #                                                       SEND MESSAGE                                                     #
  ##########################################################################################################################
  */
  // Send Text Method
  async sendText(phoneNumber, text) {
    const sentObj = await this.client.sendText(phoneNumber, text);
    if (!this.typeGuards.isSentTextObj(sentObj))
      throw new Error('message not sent');
    return this.getMessageById(sentObj.to._serialized);
  }
  // Send Reply Method
  async sendReply(phoneNumber, text, quoteId) {
    // check if message exists
    const replyTarget = await this.getMessageById(quoteId);
    if (!replyTarget)
      quoteId = '';
    // then send reply
    const reply = await this.client.reply(phoneNumber, text, quoteId);
    // get message by id
    return await this.getMessageById(reply.id);
  }
  // Send Message Method
  async send(to, text, log, quoteId) {
    // check if bot has started
    if (!this.bot.started)
      throw new Error('bot not started');
    // fetch text data
    to = await this.fetch(to);
    text = await this.fetch(text);
    log = await this.fetch(log);
    quoteId = await this.fetch(quoteId);
    // check params consistency
    if (!is.string(to))
      throw new Error('argument "to" not valid');
    if (!is.string(text))
      throw new Error('argument "text" not valid');
    if (log && !is.string(log))
      throw new Error('argument "log" not valid');
    if (quoteId && !is.string(quoteId))
      throw new Error('argument "quoteId" not valid');
    // get number from contacts
    const phoneNumber = this.contact(to);
    // set message object
    const result = (quoteId ?
      await this.misc.handle.safe(this.sendReply, this)(phoneNumber, text, quoteId) :
      await this.misc.handle.safe(this.sendText, this)(phoneNumber, text));
    // send message
    const [data, sendMessageError] = result;
    // check for error
    if (sendMessageError) {
      await this.bot.log(`Throw(bot::send_msg) Catch(${sendMessageError})`);
      throw sendMessageError;
    }
    // on success
    await this.bot.log(`Sent(${log}) To(${to})`);
    const sent = this.setMessage(data);
    // return message
    return sent;
  }
  // Safe Send Message Method
  async sends(to, text, log, quoteId) {
    const send = this.misc.handle.safe(this.send, this);
    return send(to, text, log, quoteId);
  }
}
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
    this.api.add('host_device', async (req) => this.bot.client.getHostDevice());
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
    try { // Create Venom Instance
      const create = this.misc.handle.safe(Venom.create, Venom);
      const [client, clientError] = await create(session);
      // Check for Error
      if (clientError)
        throw clientError;
      // Assign Client Object to Bot
      this.client = client;
      this.bot.started = true;
      // If Error Occurred
    } catch (error) {
      // Log Error
      await this.bot.log(`Throw(bot::start) Catch(${error})`);
    }
    // Check for Client
    if (!this.client)
      return false;
    // Start Whapp Services
    await this.whapp.start();
    // Set On-Message Function
    this.client.onMessage(msg => this.whapp.onMessage(msg));
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
