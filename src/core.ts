/*
##########################################################################################################################
#                                                        AVBOT CORE                                                      #
##########################################################################################################################
*/

// Imports
import Venom from 'venom-bot'
import Miscellaneous from './miscellaneous.js'
import type * as expressCore from 'express-serve-static-core'
import type { AxiosResponse } from 'axios'

/*
##########################################################################################################################
#                                                       MESSAGE CLASS                                                    #
##########################################################################################################################
*/

function setMessage(bot: Bot, sent: Venom.Message): ISent {
  if (typeof sent !== 'object') return
  if (!sent.isGroupMsg) sent.author = sent.from
  bot.replyables[sent.id] = () => null
  const sentR: ISent = Object.assign(
    {},
    sent,
    {
      quotedMsg: setMessage(bot, sent.quotedMsgObj),
      async send(msg: string, log = '', replyId?: string): Promise<ISent> {
        return await bot.send(sent.from, msg, log, replyId)
      },
      async quote(msg: string, log = ''): Promise<ISent> {
        return await bot.send(sent.from, msg, log, sent.id)
      },
      reply(exec = (msg: ISent) => null): boolean {
        if (typeof exec !== 'function') return false
        bot.replyables[sent.id] = exec
        return true
      },
      clean(): string {
        return bot.chat.clean(sent.body)
      }
    }
  )
  return sentR
}

// Format Message
interface ISent extends Venom.Message {
  readonly quotedMsg: ISent
  send(msg: string, log?: string, replyId?: string): Promise<ISent>
  quote(msg: string, log?: string): Promise<ISent>
  reply(exec: any): boolean
  clean(): string
}

/*
##########################################################################################################################
#                                                         CHAT CLASS                                                     #
##########################################################################################################################
*/

// Defines Chat Object
class Chat {
  reference: { bot: Bot }

  constructor(bot: Bot) {
    this.reference = {
      get bot() {
        return bot
      }
    }
  }

  get chat(): Chat { return this }

  get bot(): Bot { return this.reference.bot }

  // Clean Message
  clean(message: string | ISent, lower = true): string {
    let str: string = ''
    if (typeof message === 'string') str = message
    else str = message.body
    str = lower ? str.toLowerCase() : str
    str = str.replace(this.bot.id, '')
    while (str.includes('  ')) {
      str = str.replace('  ', ' ')
    }
    str = str.trim()
    str = str.normalize('NFD')
    str = str.replace(/[\u0300-\u036f]/g, '')
    return str
  }

  get hi(): string {
    return this.bot.misc.rand(['Opa!!', 'Ola!', 'Oi!'])
  }

  get done(): string {
    return this.bot.misc.rand(['Pronto!', 'Certo!', 'Ok!'])
  }

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
    return
  }

  get gotIt(): string {
    let msg = this.bot.misc.rand([this.hi, this.hi, ''])
    msg += (msg === '' ? '' : ' ')
    msg += this.timeGreet + ', '
    msg += this.bot.misc.rand(['é pra já! 👍', 'entendido! 👍', 'Ok! 👍',
      'como desejar! 👍', 'deixa comigo! 👍', 'pode deixar! 👍'
    ])
    return msg
  }

  get gotMention(): string {
    let msg = this.bot.misc.rand(['🙋🏾‍♂‍', '😁'])
    msg += ' ' + this.bot.misc.rand(['Eu', 'Aqui'])
    return msg
  }

  get askPython(): Record<string, string> {
    const misc = this.bot.misc
    const chat = this
    return {
      get asking(): string {
        let msg = misc.rand([this.hi, this.hi, ''])
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
        return misc.rand(['Veja o que eu encontrei 👇🏾', 'Eu encontrei o seguinte 👇🏾',
          'Olha aí o que achei pra você 👇🏾', 'Isso foi o que eu encontrei 👇🏾',
          'Olha só o que eu encontrei 👇🏾', 'Eu encontrei isso aqui 👇🏾'
        ])
      }
    }
  }

  get error(): Record<string, string> {
    const misc = this.bot.misc
    return {
      get network(): string {
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
#                                                     INTERFACE CLASS                                                    #
##########################################################################################################################
*/

// Interface Class
class Interface {
  actions: Record<string, any>
  conn: boolean
  auth: string
  app: expressCore.Express
  reference: { bot: Bot }

  constructor(bot: Bot) {
    this.reference = {
      get bot() {
        return bot
      }
    }
    // Interface Actions Object
    this.actions = new Object()
    // Set Connection Status Object
    this.conn = undefined
    // Set Authentication
    this.auth = 'vet89u43t0jw234erwedf21sd9R78fe2n2084u'
    // Define App
    this.app = this.bot.misc.express()
    this.app.use(this.bot.misc.basicAuth({
      users: {
        bot: this.auth
      }
    }))
    this.app.use(this.bot.misc.bodyParser.json())
    // Set Bot Interface
    this.app.get('/bot', async (req, res) => {
      // Execute Functionality
      const status = await this.bot.interf.execute(req)
      // Send Response
      res.send(JSON.stringify(status))
    })
  }

  get interf() { return this }

  get bot() { return this.reference.bot }

  // Interface
  async Interface(data: Record<number | string, any>): Promise<AxiosResponse<any>> {
    if (typeof data !== 'object') return
    return this.bot.misc.axios.post(
      'http://127.0.0.1:1515/bot',
      JSON.parse(JSON.stringify(data)), {
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
    await this.Interface({})
    .catch(e => conn = false)
    .then(v => conn = true)
    // check result
    if (this.conn !== conn) {
      const l1 = 'Connection with Python Established'
      const l2 = 'No Connection with Python'
      const log = conn ? l1 : l2
      await this.bot.log(log)
      this.conn = conn
      // Send Message to Admin
      await this.bot.send('5599991087255@c.us', log, 'warning')
    }
    // return result
    return conn
  }

  // Start Interface App
  start(): boolean {
    // listen on port 1616
    this.app.listen(1616)
    // check link constantly
    const cycle = async () => {
      while (true) {
        await this.bot.misc.wait(1)
        await this.link()
      }
    }
    cycle()
    // return success
    return true
  }

  // Interface Execute Bot Command
  async execute(req: expressCore.Request) {
    const error = {
      done: false,
      status: 'action not found'
    }
    // check request
    if (typeof req !== 'object') return error
    if (typeof req.body !== 'object') return error
    if (typeof req.body.action !== 'string') return error
    if (req.body.action.length === 0) return error
    if (!(req.body.action in this.actions)) return error
    // Execute Action
    const ip = this.bot.misc.requestIp.getClientIp(req)
    await this.bot.log(`Exec(api::${req.body.action}) From(${ip})`)
    const data = await this.actions[req.body.action](req)
    return {
      done: true,
      status: 'executed',
      data: data
    }
  }

  // Add Bot Interface Action
  add(
    name: string,
    func: (r: expressCore.Request) => any
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
#                                                         BOT CLASS                                                      #
##########################################################################################################################
*/

// Bot Class
export default class Bot {
  misc: Miscellaneous
  id: string
  client?: Venom.Whatsapp
  actions: Record<string, Record<string, (...p: any[]) => any>>
  replyables: Record<string, (...p: any[]) => any>
  started: boolean
  chat: Chat
  interf: Interface

  constructor() {

    // Get Miscellaneous Methods
    this.misc = new Miscellaneous()

    // Bot Properties
    this.id = '@559981672091'
    this.started = false

    // Set Lists
    this.actions = {}
    this.replyables = {}

    // Nest Objects
    this.chat = new Chat(this)
    this.interf = new Interface(this)

    // Add else Method to Bot
    this.add('else', m => null)

    // Add send_msg Method to Interface
    this.interf.add(
      'send_msg',
      async req => {
        const r = req.body
        // fix parameters
        const to = r.to != null ? r.to : '559991689748-1581718447@g.us'
        const msg = r.msg != null ? r.msg : 'Mensagem Vazia'
        const log = r.log != null ? r.log : 'api::send_msg'
        const reply_id = r.reply_id != null ? r.reply_id : null
        // send message
        const sent = await this.bot.send(to, msg, log, reply_id)
        if (!sent) return
        // set default reply action
        sent.reply((message: ISent) => {
          this.bot.interf.Interface({
            action: 'on_reply',
            sent_id: sent.id,
            reply: message
          })
        })
        return sent
      })
  }

  /*
  ##########################################################################################################################
  #                                                      BOT METHODS                                                       #
  ##########################################################################################################################
  */

  // Allow Info
  get bot() {
    return this
  }

  // Saves Log
  async log(log: string | Error): Promise<void> {
    // Structure
    const t = this.bot.misc.timestamp
    console.log(`(${t}) ${log}`)
  }

  // Start App
  async start(session: string): Promise<boolean> {
    // Create Venom Instance
    let client: Venom.Whatsapp = null
    await Venom.create(session)
    .catch(error => console.error(error))
    .then(wp => client = wp || null)
    // if error occurred
    if (!client) return false
    // Copy Client Object from Venom
    this.client = client
    // Set on_message Function
    this.client.onMessage(msg => this.bot.onMessage(msg))
    // start core application
    this.bot.interf.start()
    this.bot.started = true
    this.bot.log('Avbot::Started')
    // return status
    return this.bot.started
  }

  // Send Message Method
  async send(to: string, msg: string, log = '', replyId?: string): Promise<ISent> {
    return await new Promise(async resolve => {
      // check if bot has started
      if (!this.bot.started) {
        resolve(null)
        return
      }
      // check params
      const s = e => (e != null ? `${e}` : null)
      to = s(to)
      msg = s(msg)
      log = s(log)
      replyId = s(replyId)
      // check for reply id
      let sent: Promise<Venom.Message> = null
      if (replyId != null) {
        // check if message exists
        const getM = () => this.bot.client.getMessageById(replyId)
        const checkM = (m: Venom.Message) => typeof m === 'object'
        await this.misc.try(10, 1, getM, checkM)
          .catch(e => replyId = null)
        // then send reply
        sent = this.bot.client.reply(to, msg, replyId)
        // else send text
      } else sent = this.bot.client.sendText(to, msg)
      // send message
      sent
        .catch(async error => {
          await this.bot.log(`Error(send_msg) Throw(${error})`)
          resolve(null)
        })
        .then(async msg => {
          await this.bot.log(`Sent(${log}) To(${to})`)
          if (!msg) {
            resolve(null)
            return
          }
          const msgR = setMessage(this.bot, msg)
          resolve(msgR)
        })
    })
  }

  // Get Message Method
  async onMessage(message: Venom.Message): Promise<any> {
    if (!this.bot.started) return
    if (!('body' in message)) return
    if (message.from === 'status@broadcast') return
    const uSent = setMessage(this.bot, message)
    const isgr = (uSent.isGroupMsg === true)
    const ment = (uSent.body.includes(this.bot.id))
    if (ment) await uSent.quote(this.bot.chat.gotMention, 'got_mention')
    if (typeof uSent.quotedMsg === 'object') await this.bot.onReply(uSent)
    const data = (ment || !isgr) ? await this.execute(uSent) : null
    return data
  }

  // Get Reply Method
  async onReply(message: ISent) {
    if (!message.quotedMsg) return
    const replyable = message.quotedMsg.id
    if (!(replyable in this.bot.replyables)) return
    return await this.bot.replyables[replyable](message)
  }

  // Execute Bot Command
  async execute(message: ISent): Promise<any> {
    for (const action of Object.values(this.bot.actions)) {
      if (action.cond != null ? action.cond(message) : false) {
        await this.bot.log(`Exec(bot::${action.name}) From(${message.from})`)
        return await action.exec(message)
      }
    }
    // Else Ask Python
    await this.bot.log(`Exec(bot::ask_python) From(${message.from})`)
    return await this.bot.actions.else.do(message)
  }

  // Add Bot Action
  add(
    name: string,
    cond: (m: ISent) => any,
    exec?: (m: ISent) => any
  ): boolean {
    if (typeof cond !== 'function') return false
    if (typeof exec !== 'function') return false
    if (typeof name !== 'string') return false
    if (name.length === 0) return false
    let action: any = {
      name: name,
      cond: cond,
      exec: exec
    }
    if (name === 'else') action = {
      name: name,
      do: cond
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
