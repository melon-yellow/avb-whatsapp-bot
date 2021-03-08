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

// New Miscellaneous Object
const misc = new Miscellaneous()

/*
##########################################################################################################################
#                                                    MESSAGE INTERFACES                                                  #
##########################################################################################################################
*/

// Message Text Type
type TMessageText = string | Promise<string> | (() => string | Promise<string>)

// Sent Message Interface
interface ISent extends Venom.Message {
  readonly whapp: Whapp
  readonly quotedMsg: ISent
  send(msg: TMessageText, log?: string, replyId?: string): Promise<ISent>
  quote(msg: TMessageText, log?: string): Promise<ISent>
  onReply(exec: TExec): boolean
  clean(): string
}

// Sent Text Object
interface ISentTextObj {
  to: { _serialized: string }
}

// Check if Is Sent Text Object
function isSentTextObj(obj: unknown): obj is ISentTextObj {
  if (!misc.typeGuards.isObject(obj)) return false
  else if (!('to' in obj)) return false
  else if (!misc.typeGuards.isObject(obj.to)) return false
  else if (!('_serialized' in obj.to)) return false
  else if (typeof obj.to._serialized !== 'string') return false
  else return true
}

/*
##########################################################################################################################
#                                                     ACTION INTERFACES                                                  #
##########################################################################################################################
*/

// Exec Function Type
type TExec = (m: ISent) => any

// Interface Action Interface
type IInterfaceAction = (req: expressCore.Request) => any

// Action Interface
interface IAction {
  readonly name: string,
  cond?: TExec,
  exec?: TExec,
  do?: TExec
}

/*
##########################################################################################################################
#                                                         WHAPP CLASS                                                    #
##########################################################################################################################
*/

class Whapp {
  bot: Bot
  me: VenomHostDevice.Me
  replyables: Record<string, TExec>

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
  async fetch(to: string, data: TMessageText): Promise<string> {
    // Set Resolution Variable
    let resolution: string = null
    // check for type of input
    if (typeof data === 'string') resolution = data
    else if (data instanceof Promise) resolution = await data
    else if (typeof data === 'function') {
      const preRes = data()
      if (typeof preRes === 'string') resolution = preRes
      else if (preRes instanceof Promise) resolution = await preRes
    }
    // chefk for type of output
    if (typeof resolution !== 'string') resolution = null
    // return text
    return resolution
  }

  // get contacts list
  contactsList(flag?: number): Record<string, string> {
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
    const trial = this.misc.try(getMessage, checkMessage)
    return await new Promise(resolve => {
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
          id: `${sent.id}`,
          body: `${sent.body}`,
          // Fix Contact Names
          from: whapp.contact(`${sent.from}`, -1),
          author: whapp.contact(`${sent.author}`, -1),
          // Fix Quoted Message Object
          quotedMsg: whapp.setMessage(sent.quotedMsgObj),
          quotedMsgObj: null,
          // Send Message to Chat
          async send(msg: TMessageText, log?: string, replyId?: string): Promise<ISent> {
            return this.whapp.send(this.from, msg, log, replyId)
          },
          // Quote Message
          async quote(msg: TMessageText, log?: string): Promise<ISent> {
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

  // Send Message Method
  async send(to: string, msg: TMessageText, log = '[text]', replyId?: string): Promise<ISent> {
    // check if bot has started
    if (!this.bot.started) return
    // get number from contacts
    const numRef = this.contact(to)
    // fetch message text data
    msg = await this.fetch(numRef, msg)
    if (typeof msg !== 'string') return
    // check for reply id
    let sent: Promise<Venom.Message> = null
    try {
      if (!replyId) {
        const sentObj = await this.client.sendText(numRef, msg)
        if (!isSentTextObj(sentObj)) throw Error('Sent Object Not Found')
        sent = this.getMessageById(sentObj.to._serialized)
      } else {
      // check if message exists
        const toReply = await this.getMessageById(replyId)
        if (!toReply) replyId = ''
        // then send reply
        sent = this.client.reply(numRef, msg, replyId)
      }
    } catch (error) {
      sent = new Promise((resolve, reject) => reject(error))
    }
    // set message
    let message: ISent = null
    await sent
    await new Promise(resolve => {
      sent
        .catch(async error => {
          await this.bot.log(`Throw(bot::send_msg) Catch(${error})`)
          resolve(null)
        })
        .then(async msg => {
          if (msg) {
            await this.bot.log(`Sent(${log}) To(${to})`)
            message = this.setMessage(msg)
          }
          resolve(null)
        })
    })
    // return message
    return message
  }
}

/*
##########################################################################################################################
#                                                     INTERFACE CLASS                                                    #
##########################################################################################################################
*/

// Interface Class
class Interface {
  bot: Bot
  conn: boolean
  auth: string
  app: expressCore.Express
  actions: Record<string, IInterfaceAction>

  constructor (bot: Bot) {
    Object.defineProperty(this, 'bot',
      { get() { return bot } }
    )
    // Interface Actions Object
    this.actions = {}
    // Set Connection Status Object
    this.conn = undefined
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
    this.app.get('/interface', async (req, res) => {
      // Execute Functionality
      const status = await this.bot.interf.execute(req)
      // Send Response
      res.send(JSON.stringify(
        this.misc.serialize(status)
      ))
    })
  }

  /*
  ##########################################################################################################################
  #                                                    INTERFACE METHODS                                                   #
  ##########################################################################################################################
  */

  // Cycle Reference
  get interf() { return this }
  get misc() { return this.bot.misc }

  // Interface
  async Interface(data: any): Promise<AxiosResponse<any>> {
    return this.misc.axios.post(
      'http://127.0.0.1:1516/interface',
      this.misc.serialize(data),
      {
        auth: {
          username: 'bot',
          password: this.auth
        }
      }
    )
  }

  // Check Connection
  async link(): Promise<boolean> {
    // test connection
    let conn = false
    await this.Interface(null)
      .catch(e => { conn = false })
      .then(v => { conn = true })
    // check result
    if (this.conn !== conn) {
      const l1 = 'Connection with Python Established'
      const l2 = 'No Connection with Python'
      const log = conn ? l1 : l2
      await this.bot.log(log)
      this.conn = conn
      // Send Message to Admin
      await this.bot.send('anthony', log, 'py_conn_status')
    }
    // return result
    return conn
  }

  // Start Interface App
  async start() {
    try {
      // listen on port 1615
      this.app.listen(1615)
      // check link constantly
      const cycle = async () => {
        while (true) {
          await this.misc.wait(1)
          await this.link()
        }
      }
      cycle()
    } catch { return false }
    // return success
    return true
  }

  /*
  ##########################################################################################################################
  #                                               INTERFACE EXECUTION METHODS                                              #
  ##########################################################################################################################
  */

  // Interface Execute Bot Command
  async execute(req: expressCore.Request) {
    const error = {
      done: false,
      status: 'action not found'
    }
    // check request
    if (!this.misc.typeGuards.isObject(req)) return error
    if (!this.misc.typeGuards.isObject(req.body)) return error
    if (typeof req.body.action !== 'string') return error
    if (req.body.action.length === 0) return error
    if (!(req.body.action in this.actions)) return error
    // Execute Action
    const ip = this.misc.requestIp.getClientIp(req)
    await this.bot.log(`Exec(api::${req.body.action}) From(${ip})`)
    const data = await this.interf.actions[req.body.action](req)
    return {
      done: true,
      status: 'executed',
      data: data
    }
  }

  // Add Bot Interface Action
  add(
    name: string,
    func: IInterfaceAction
  ): boolean {
    if (typeof func !== 'function') return false
    if (typeof name !== 'string') return false
    if (name.length === 0) return false
    this.actions[name] = func
    return true
  }
}

/*
##########################################################################################################################
#                                                         CHAT CLASS                                                     #
##########################################################################################################################
*/

// Defines Chat Object
class Chat {
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
    let msg = this.misc.rand(['🙋🏾‍♂‍', '😁'])
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
  interf: Interface
  whapp: Whapp
  chat: Chat

  constructor () {
    // Get Miscellaneous Methods
    this.misc = misc

    // Bot Properties
    this.started = false

    // Set Lists
    this.actions = {}

    // Nest Objects
    this.interf = new Interface(this)
    this.whapp = new Whapp(this)
    this.chat = new Chat(this)

    // Add else Method to Bot
    this.add('else', m => null)

    // Add send_msg Method to Interface
    this.interf.add('send_msg',
      async req => {
        if (!this.misc.typeGuards.isObject(req.body)) return
        // fix parameters
        const to = req.body.to || 'demandas_automacao'
        const msg = req.body.msg || 'Mensagem Vazia'
        const log = req.body.log || 'api::send_msg'
        const replyId = req.body.reply_id || null
        // send message
        const sent = await this.bot.send(to, msg, log, replyId)
        // if not sent prevent execution
        if (!sent) return
        // set default reply action
        sent.onReply(message => {
          this.bot.interf.Interface({
            action: 'on_reply',
            msg_id: sent.id,
            reply: message
          })
            .catch(
              error => this.bot.log(`Throw(api::on_reply) Catch(${error})`)
            )
        })
        return sent
      })
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
    // Create Venom Instance
    await Venom.create(session)
      .catch(error => this.bot.log(`Throw(bot::start) Catch(${error})`))
      .then((client: Venom.Whatsapp) => {
        if (!client) return
        this.client = client
        this.bot.started = true
      })
    // Prevent Error
    if (!this.client) return false
    // Start Whapp Services
    await this.whapp.start()
    // Set On-Message Function
    this.client.onMessage(msg => this.whapp.onMessage(msg))
    // Log Start of Bot
    await this.bot.log('Avbot::Started')
    // Send Message to Admin
    await this.send('anthony', 'Node Avbot Started!', 'bot_start')
    // Start Interface App
    await this.bot.interf.start()
    // return status
    return this.bot.started
  }

  /*
  ##########################################################################################################################
  #                                                       SEND MESSAGE                                                     #
  ##########################################################################################################################
  */

  // Send Message Method
  async send(to: string, msg: TMessageText, log?: string, replyId?: string): Promise<ISent> {
    return this.whapp.send(to, msg, log, replyId)
  }

  /*
  ##########################################################################################################################
  #                                                     EXECUTION METHODS                                                  #
  ##########################################################################################################################
  */

  // Execute Bot Command
  async execute(message: ISent): Promise<any> {
    for (const action of Object.values(this.bot.actions)) {
      if (action.cond ? action.cond(message) : false) {
        await this.bot.log(`Exec(bot::${action.name}) From(${message.from})`)
        return await action.exec(message)
      }
    }
    // Else Ask Python
    await this.bot.log(`Exec(bot::else) From(${message.from})`)
    return await this.bot.actions.else.do(message)
  }

  // Add Bot Action
  add(
    name: string,
    cond: TExec,
    exec?: TExec
  ): boolean {
    if (typeof cond !== 'function') return false
    if (!!exec && typeof exec !== 'function') return false
    if (typeof name !== 'string') return false
    if (name.length === 0) return false
    let action: IAction = {
      name: name,
      cond: cond,
      exec: exec
    }
    if (name === 'else') {
      action = {
        name: name,
        do: cond
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
