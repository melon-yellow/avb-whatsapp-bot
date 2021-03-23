/*
##########################################################################################################################
#                                                        AVBOT CORE                                                      #
##########################################################################################################################
*/

// Imports
import Venom from 'venom-bot'
import Miscellaneous from './miscellaneous.js'
import type * as expressCore from 'express-serve-static-core'
import type VenomHostDevice from 'venom-bot/dist/api/model/host-device'
import type { AxiosResponse } from 'axios'

/*
##########################################################################################################################
#                                                    MISCELLANEOUS CLASS                                                 #
##########################################################################################################################
*/

// New Miscellaneous Object
const misc = new Miscellaneous()

/*
##########################################################################################################################
#                                                    MESSAGE INTERFACES                                                  #
##########################################################################################################################
*/

// Message Text Type
type TFetchString = string | Promise<string> | (() => string | Promise<string>)

// Sent Message Interface
interface ISent extends Venom.Message {
  readonly whapp: Whapp
  readonly quotedMsg: ISent
  send(msg: TFetchString, log?: TFetchString, replyId?: TFetchString): Promise<ISent>
  quote(msg: TFetchString, log?: TFetchString): Promise<ISent>
  onReply(exec: TExec): boolean
  clean(): string
}

// Sent Text Object
interface ISentTextObj {
  to: { _serialized: string }
}

// Type Guards
export class WhappTypeGuards {
  // Check if Is Sent Text Object
  isSentTextObj(obj: unknown): obj is ISentTextObj {
    if (!misc.typeGuards.isObject(obj)) return false
    else if (!('to' in obj)) return false
    else if (!misc.typeGuards.isObject(obj.to)) return false
    else if (!('_serialized' in obj.to)) return false
    else if (typeof obj.to._serialized !== 'string') return false
    else return true
  }
}

/*
##########################################################################################################################
#                                                     ACTION INTERFACES                                                  #
##########################################################################################################################
*/

// Exec Function Type
type TExec = (m: ISent) => any
type TAExec = (m: ISent) => Promise<[any, Error]>

// Interface Action Interface
type IAPIAction = (req: expressCore.Request) => any
type IAAPIAction = (req: expressCore.Request) => Promise<[any, Error]>

// Action Interface
interface IAction {
  readonly name: string,
  cond?: TAExec,
  do: TAExec
}

/*
##########################################################################################################################
#                                                         WHAPP CLASS                                                    #
##########################################################################################################################
*/

export class Whapp {
  bot: Bot
  me: VenomHostDevice.Me
  replyables: Record<string, TAExec>

  typeGuards = new WhappTypeGuards()

  constructor (bot: Bot) {
    Object.defineProperty(this, 'bot',
      { get() { return bot } }
    )
    // Set Replyables List
    this.replyables = {}
  }

  // Cycle Reference
  get whapp() { return this }
  get misc() { return this.bot.misc }

  /*
  ##########################################################################################################################
  #                                                     EXECUTION METHODS                                                  #
  ##########################################################################################################################
  */

  // Venom Client
  get client(): Venom.Whatsapp {
    return this.bot.client
  }

  // Start Whapp
  async start() {
    // check if bot started
    if (!this.bot.started) return false
    // get host data
    const hostDevice = await this.client.getHostDevice()
    this.me = hostDevice.wid
    // return done
    return true
  }

  /*
  ##########################################################################################################################
  #                                                     EXECUTION METHODS                                                  #
  ##########################################################################################################################
  */

  // Get Message Method
  async onMessage(message: Venom.Message): Promise<any> {
    if (!this.bot.started) return
    else if (!this.misc.typeGuards.isObject(message)) return
    else if (!('body' in message)) return
    else if (message.from === 'status@broadcast') return
    const uSent = this.setMessage(message)
    const isGroup = uSent.isGroupMsg === true
    const ment = uSent.body.includes(`@${this.whapp.me.user}`)
    if (ment) await uSent.quote(this.bot.chat.gotMention, 'got_mention')
    if (typeof uSent.quotedMsg === 'object') return await this.onReply(uSent)
    const data = (ment || !isGroup) ? await this.bot.execute(uSent) : null
    return data
  }

  // Get Reply Method
  async onReply(message: ISent) {
    if (!message.quotedMsg) return
    const replyable = message.quotedMsg.id
    if (replyable in this.whapp.replyables) {
      return await this.whapp.replyables[replyable](message)
    }
  }

  // Add On-Reply Action
  addReplyable(sentId: string, exec: TExec): boolean {
    if (typeof exec !== 'function') return false
    this.replyables[sentId] = exec
    return true
  }

  /*
  ##########################################################################################################################
  #                                                    AUXILIARY METHODS                                                   #
  ##########################################################################################################################
  */

  // fetch data for message
  async fetch(data: TFetchString): Promise<string> {
    // Set Resolution Variable
    let resolution: string = null
    // check typeof input
    if (typeof data === 'string') resolution = data
    else if (this.misc.typeGuards.isPromise(data)) resolution = await data
    else if (typeof data === 'function') {
      const preRes = data()
      if (typeof preRes === 'string') resolution = preRes
      else if (this.misc.typeGuards.isPromise(preRes)) resolution = await preRes
    }
    // check typeof output
    if (typeof resolution !== 'string') resolution = null
    // return text
    return resolution
  }

  // get contacts list
  contactsList(flag?: number): Record<string, string> {
    // check if directory exists
    if (!this.misc.fs.existsSync('./private')) {
      this.misc.fs.mkdirSync('./private')
    }
    // check if file exists
    if (!this.misc.fs.existsSync('./private/contacts.bot.json')) {
      this.misc.fs.writeFileSync('./private/contacts.bot.json', '{}')
    }
    // get contacts from json
    let contacts: Record<string, string> = JSON.parse(
      this.misc.fs.readFileSync('./private/contacts.bot.json').toString()
    )
    // use flags
    if (flag === -1) {
      contacts = Object.entries(contacts)
        .reduce((ret, entry) => {
          const [key, value] = entry
          ret[value] = key
          return ret
        }, {})
    }
    // return contacts
    return contacts
  }

  // replace contact name
  contact(to: string, flag?: number): string {
    let contact = `${to}`
    const params = []
    if (flag) params.push(flag)
    const contacts = this.contactsList(...params)
    // replace cyclicaly
    while (Object.keys(contacts).includes(contact)) {
      contact = contacts[contact]
    }
    // return result
    return contact
  }

  // Get Message By Id
  async getMessageById(id: string): Promise<ISent> {
    const getMessage = () => this.client.getMessageById(id)
    const checkMessage = (obj: unknown) => this.misc.typeGuards.isObject(obj) && !obj.erro
    const trial = this.misc.try(getMessage.bind(this), checkMessage.bind(this))
    return new Promise(resolve => {
      trial
        .catch(error => this.misc.noOp(error) || resolve(null))
        .then(value => resolve(this.setMessage(value)))
    })
  }

  /*
  ##########################################################################################################################
  #                                                    MESSAGE CONSTRUCTOR                                                 #
  ##########################################################################################################################
  */

  // Message Constructor
  setMessage(sent: Venom.Message): ISent {
    // Prevent Empty Message Objects
    if (!sent || !this.misc.typeGuards.isObject(sent)) return
    // Fix Author on Private Messages
    if (!sent.isGroupMsg) sent.author = sent.from
    // Allow Cyclic Reference
    const whapp = this
    // Assign Message Properties
    const message: ISent = Object.defineProperty(
      Object.assign({}, sent,
        {
          // Set Properties
          id: sent.id,
          body: sent.body,
          // Fix Contact Names
          from: whapp.contact(sent.from, -1),
          author: whapp.contact(sent.author, -1),
          // Fix Quoted Message Object
          quotedMsg: whapp.setMessage(sent.quotedMsgObj),
          quotedMsgObj: null,
          // Send Message to Chat
          async send(msg: TFetchString, log?: TFetchString, replyId?: TFetchString): Promise<ISent> {
            return this.whapp.send(this.from, msg, log, replyId)
          },
          // Quote Message
          async quote(msg: TFetchString, log?: TFetchString): Promise<ISent> {
            return this.send(msg, log, this.id)
          },
          // Set On-Reply Action
          onReply(exec: TExec): boolean {
            if (typeof exec !== 'function') return false
            this.whapp.addReplyable(this.id, exec)
            return true
          },
          // Clean Message Text
          clean(): string {
            return this.whapp.bot.chat.clean(this.body)
          }
        }
      ),
      // Set Getter
      'whapp',
      { get() { return whapp } }
    )
    // return Message Object
    return message
  }

  /*
  ##########################################################################################################################
  #                                                       SEND MESSAGE                                                     #
  ##########################################################################################################################
  */

  // Send Text Method
  async sendText(phoneNumber: string, text: string): Promise<ISent> {
    const sentObj = await this.client.sendText(phoneNumber, text)
    if (!this.typeGuards.isSentTextObj(sentObj)) throw new Error('message not sent')
    return this.getMessageById(sentObj.to._serialized)
  }

  // Send Reply Method
  async sendReply(phoneNumber: string, text: string, replyId: string): Promise<ISent> {
    // check if message exists
    const replyTarget = await this.getMessageById(replyId)
    if (!replyTarget) replyId = ''
    // then send reply
    const reply = await this.client.reply(phoneNumber, text, replyId)
    // get message by id
    return await this.getMessageById(reply.id)
  }

  // Send Message Method
  async send(
    to: TFetchString,
    text: TFetchString,
    log?: TFetchString,
    replyId?: TFetchString
  ): Promise<ISent> {
    // check if bot has started
    if (!this.bot.started) throw new Error('bot not started')
    // fetch text data
    to = await this.fetch(to)
    text = await this.fetch(text)
    log = await this.fetch(log)
    replyId = await this.fetch(replyId)
    // check params consistency
    if (typeof to !== 'string') throw new Error('argument "to" not valid')
    if (typeof text !== 'string') throw new Error('argument "text" not valid')
    if (log && typeof log !== 'string') throw new Error('argument "log" not valid')
    if (replyId && typeof replyId !== 'string') throw new Error('argument "replyId" not valid')
    // get number from contacts
    const phoneNumber = this.contact(to)
    // set message object
    let send: (...params: string[]) => Promise<[Venom.Message, Error]>
    const params = [phoneNumber, text]
    if (!replyId) send = this.misc.safe(this.sendText.bind(this))
    else {
      send = this.misc.safe(this.sendReply.bind(this))
      params.push(replyId)
    }
    // send message
    const [data, sendMessageError] = await send(...params)
    // check for error
    if (sendMessageError) {
      await this.bot.log(`Throw(bot::send_msg) Catch(${sendMessageError})`)
      throw sendMessageError
    }
    // on success
    await this.bot.log(`Sent(${log}) To(${to})`)
    const sent = this.setMessage(data)
    // return message
    return sent
  }

  // Safe Send Message Method
  async sends(
    to: TFetchString,
    msg: TFetchString,
    log?: TFetchString,
    replyId?: TFetchString
  ): Promise<[ISent, Error]> {
    type TSend = (...params: TFetchString[]) => Promise<[ISent, Error]>
    const send: TSend = this.misc.safe(this.send.bind(this))
    return send(to, msg, log, replyId)
  }
}

/*
##########################################################################################################################
#                                                           API CLASS                                                    #
##########################################################################################################################
*/

// API Class
export class API {
  bot: Bot
  auth: string
  app: expressCore.Express
  actions: Record<string, IAAPIAction>

  constructor (bot: Bot) {
    Object.defineProperty(this, 'bot',
      { get() { return bot } }
    )
    // Interface Actions Object
    this.actions = {}
    // Set Authentication
    this.auth = 'ert2tyt3tQ3423rubu99ibasid8hya8da76sd'
    // Define App
    this.app = this.misc.express()
    this.app.use(
      this.misc.basicAuth({
        users: { bot: this.auth }
      })
    )
    this.app.use(this.misc.express.json())
    // Set Bot Interface
    this.app.post('/bot', async (req, res) => {
      // Execute Functionality
      const response = await this.api.execute(req)
      // Send Response
      res.send(JSON.stringify(
        this.misc.serialize(response)
      ))
    })
  }

  /*
  ##########################################################################################################################
  #                                                          API METHODS                                                   #
  ##########################################################################################################################
  */

  // Cycle Reference
  get api() { return this }
  get misc() { return this.bot.misc }

  // Request
  async req(url: string, data: any): Promise<AxiosResponse<any>> {
    return this.misc.axios.post(
      url,
      this.misc.serialize(data),
      {
        auth: {
          username: 'bot',
          password: this.auth
        }
      }
    )
  }

  // Safe Request
  async reqs(url: string, data: any): Promise<[AxiosResponse<any>, Error]> {
    type TIRequest = (...params: any[]) => Promise<[AxiosResponse<any>, Error]>
    const req: TIRequest = this.misc.safe(this.req.bind(this))
    return req(url, data)
  }

  // Start Interface App
  async start() {
    try {
      // listen on port 1615
      this.app.listen(1615)
    // if error occurred
    } catch { return false }
    // return success
    return true
  }

  /*
  ##########################################################################################################################
  #                                                    API EXECUTION METHODS                                               #
  ##########################################################################################################################
  */

  // Interface Execute Bot Command
  async execute(req: expressCore.Request) {
    let action: string
    try {
      // check request
      if (!this.misc.typeGuards.isObject(req)) throw new Error('bad request')
      if (!this.misc.typeGuards.isObject(req.body)) throw new Error('bad request')
      if (!('action' in req.body)) throw new Error('key "action" missing in request')
      if (typeof req.body.action !== 'string') throw new Error('key "action" must be a string')
      if (req.body.action.length === 0) throw new Error('key "action" not valid')
      if (!(req.body.action in this.actions)) throw new Error('action not found')
      // update reference
      action = req.body.action
      // log action to be executed
      const ip = this.misc.requestIp.getClientIp(req).replace('::ffff:', '')
      await this.bot.log(`Exec(api::${action}) From(${ip})`)
      // execute action
      const [data, actionError] = await this.actions[action](req)
      // throw action error
      if (actionError) throw actionError
      // resolve with data
      return { done: true, data: data }
    // if error occurred
    } catch (error) {
      // log error
      if (action) await this.bot.log(`Throw(api::${action}) Catch(${error})`)
      // reject with error
      return { done: false, error: error }
    }
  }

  // Add Bot Interface Action
  add(
    name: string,
    func: IAPIAction
  ): boolean {
    if (typeof func !== 'function') return false
    if (typeof name !== 'string') return false
    if (name.length === 0) return false
    this.actions[name] = this.misc.safe(func)
    return true
  }
}

/*
##########################################################################################################################
#                                                         CHAT CLASS                                                     #
##########################################################################################################################
*/

// Defines Chat Object
export class Chat {
  bot: Bot

  constructor (bot: Bot) {
    Object.defineProperty(this, 'bot',
      { get() { return bot } }
    )
  }

  // Cycle Reference
  get chat() { return this }
  get misc() { return this.bot.misc }

  // Clean Message
  clean(message: string | ISent, lower = true): string {
    let str: string = ''
    if (typeof message === 'string') str = message
    else str = message.body
    str = lower ? str.toLowerCase() : str
    str = str.replace(`@${this.bot.whapp.me.user}`, '')
    while (str.includes('  ')) str = str.replace('  ', ' ')
    str = str.trim()
    str = str.normalize('NFD')
    str = str.replace(/[\u0300-\u036f]/g, '')
    return str
  }

  /*
  ##########################################################################################################################
  #                                                       CHAT GETTERS                                                     #
  ##########################################################################################################################
  */

  get timeGreet(): string {
    const h = new Date().getHours()
    const g = {
      6: 'Bom dia 🥱',
      12: 'Bom dia',
      18: 'Boa tarde',
      24: 'Boa noite'
    }
    for (const i in g) {
      if (h < Number(i)) {
        return g[i]
      }
    }
  }

  get hi(): string {
    return this.misc.rand(['Opa!!', 'Ola!', 'Oi!'])
  }

  get done(): string {
    return this.misc.rand(['Pronto!', 'Certo!', 'Ok!'])
  }

  get gotIt(): string {
    let msg = this.misc.rand([this.chat.hi, this.chat.hi, ''])
    msg += (msg === '' ? '' : ' ')
    msg += this.timeGreet + ', '
    msg += this.misc.rand(['é pra já! 👍', 'entendido! 👍', 'Ok! 👍',
      'como desejar! 👍', 'deixa comigo! 👍', 'pode deixar! 👍'
    ])
    return msg
  }

  get gotMention(): string {
    let msg = this.misc.rand(['🙋♂‍', '😁'])
    msg += ' ' + this.misc.rand(['Eu', 'Aqui'])
    return msg
  }

  get askPython(): Record<string, string> {
    const chat = this
    const misc = this.misc
    return {
      get asking(): string {
        let msg = misc.rand([chat.hi, chat.hi, ''])
        msg += (msg === '' ? '' : ' ') + chat.timeGreet
        msg += misc.rand([', certo', ', espera um pouquinho', '',
          ', só um momento', ', Ok', ', um instante'
        ]) + ', '
        msg += misc.rand(['vou verificar o que você está querendo 🤔',
          'vou analisar melhor o que você pediu 🤔',
          'vou analisar aqui o que você está querendo 🤔',
          'vou procurar aqui o que você pediu 🤔'
        ])
        return msg
      },
      get finally(): string {
        return misc.rand(['Veja o que eu encontrei 👇', 'Eu encontrei o seguinte 👇',
          'Olha aí o que achei pra você 👇', 'Isso foi o que eu encontrei 👇',
          'Olha só o que eu encontrei 👇', 'Eu encontrei isso aqui 👇'
        ])
      }
    }
  }

  get error(): Record<string, string> {
    const misc = this.misc
    return {
      get network (): string {
        let msg = misc.rand(['Ocorreu um erro enquanto eu buscava os dados!',
          'Oops, algo deu Errado!', 'Não pude acessar os dados!'
        ]) + ' '
        msg += misc.rand(['🤔 deve ter algum sistema fora do ar',
          '🤔 meus servidores devem estar offline',
          '🤔 deve ter caido alguma conexão minha'
        ])
        return msg
      }
    }
  }
}

/*
##########################################################################################################################
#                                                         BOT CLASS                                                      #
##########################################################################################################################
*/

// Bot Class
export default class Bot {
  misc: Miscellaneous
  client: Venom.Whatsapp
  actions: Record<string, IAction>
  started: boolean
  whapp: Whapp
  chat: Chat
  api: API

  constructor () {
    // Get Miscellaneous Methods
    this.misc = misc
    // Bot Properties
    this.started = false
    // Set Lists
    this.actions = {}

    // Nest Objects
    this.whapp = new Whapp(this)
    this.chat = new Chat(this)
    this.api = new API(this)

    // Add else Method to Bot
    this.bot.add('else', msg => null)

    // Add send_msg Action
    this.api.add('send_msg',
      async req => {
        // fix parameters
        const to = req.body.to || 'demandas_automacao'
        const msg = req.body.msg || 'Mensagem Vazia'
        const log = req.body.log || 'api::send_msg'
        const replyId = req.body.reply_id || null
        const replyUrl = req.body.reply_url || null
        // send message
        const [sent, sendMessageError] = await this.bot.sends(to, msg, log, replyId)
        // if not done prevent execution
        if (sendMessageError) throw sendMessageError
        // set default reply action
        sent.onReply(async message => {
          const json = {
            action: 'on_reply',
            msg_id: sent.id,
            reply: message
          }
          const [data, onReplyError] = await this.api.reqs(replyUrl, json)
          if (onReplyError) throw onReplyError
          return data
        })
        // return message
        return sent
      }
    )

    // Add get_message Action
    this.api.add('get_message',
      async req => {
        if (!('id' in req.body)) throw new Error('key "id" missing in request')
        if (typeof req.body.id !== 'string') throw new Error('key "id" must be a string')
        if (req.body.id.length === 0) throw new Error('key "id" not valid')
        return this.whapp.getMessageById(req.body.id)
      }
    )

    // Add host_device Action
    this.api.add('host_device',
      async req => this.bot.client.getHostDevice()
    )
  }

  /*
  ##########################################################################################################################
  #                                                      BOT METHODS                                                       #
  ##########################################################################################################################
  */

  // Cycle Reference
  get bot() { return this }

  // Saves Log
  async log(log: string | Error): Promise<void> {
    // Structure
    const t = this.misc.timestamp
    console.log(`(${t}) ${log}`)
  }

  /*
  ##########################################################################################################################
  #                                                      START METHOD                                                      #
  ##########################################################################################################################
  */

  // Start App
  async start(session: string): Promise<boolean> {
    try { // Create Venom Instance
      type TVenomCreate = (session: string) => Promise<[Venom.Whatsapp, Error]>
      const create: TVenomCreate = this.misc.safe(Venom.create.bind(Venom))
      const [client, clientError] = await create(session)
      // Check for Error
      if (clientError) throw clientError
      // Assign Client Object to Bot
      this.client = client
      this.bot.started = true
    // If Error Occurred
    } catch (error) {
      // Log Error
      await this.bot.log(`Throw(bot::start) Catch(${error})`)
    }
    // Check for Client
    if (!this.client) return false
    // Start Whapp Services
    await this.whapp.start()
    // Set On-Message Function
    this.client.onMessage(msg => this.whapp.onMessage(msg))
    // Log Start of Bot
    await this.bot.log('Avbot::Started')
    // Send Message to Admin
    await this.bot.sends('anthony', 'Node Avbot Started!', 'bot_start')
    // Start Interface App
    await this.bot.api.start()
    // return status
    return this.bot.started
  }

  /*
  ##########################################################################################################################
  #                                                       SEND MESSAGE                                                     #
  ##########################################################################################################################
  */

  // Send Message Method
  get send(): (typeof Whapp.prototype.send) { return this.whapp.send.bind(this.whapp) }
  get sends(): (typeof Whapp.prototype.sends) { return this.whapp.sends.bind(this.whapp) }

  /*
  ##########################################################################################################################
  #                                                     EXECUTION METHODS                                                  #
  ##########################################################################################################################
  */

  // Execute Bot Command
  async execute(message: ISent): Promise<any> {
    // set initial
    let actionName: string
    const logAction = (action: IAction) => {
      actionName = action.name
      return this.bot.log(`Exec(bot::${action.name}) From(${message.from})`)
    }
    try {
      // Check All Action Conditions
      for (const action of Object.values(this.bot.actions)) {
        if (action.cond && action.name !== 'else') {
          const [cond, condError] = await action.cond(message)
          // console.log(`${action.name}: ${JSON.stringify([cond, condError])}`)
          if (cond && !condError) {
            await logAction(action)
            const [data, actionError] = await action.do(message)
            if (actionError) throw actionError
            else return data
          }
        }
      }
      // do Else
      const elseAction = this.bot.actions.else
      await logAction(elseAction)
      const [data, actionError] = await elseAction.do(message)
      if (actionError) throw actionError
      else return data
    // if error occurred
    } catch (error) {
      // log error
      await this.bot.log(`Throw(bot::${actionName}) Catch(${error})`)
    }
  }

  // Add Bot Action
  add(
    name: string,
    inter: TExec,
    exec?: TExec
  ): boolean {
    if (typeof inter !== 'function') return false
    if (!!exec && typeof exec !== 'function') return false
    if (typeof name !== 'string') return false
    if (name.length === 0) return false
    let action: IAction
    action = {
      name: name,
      cond: this.misc.safe(inter),
      do: this.misc.safe(exec)
    }
    if (name === 'else') {
      action = {
        name: name,
        do: this.misc.safe(inter)
      }
    }
    this.actions[name] = action
    return true
  }
}

/*
##########################################################################################################################
#                                                         END                                                            #
##########################################################################################################################
*/
