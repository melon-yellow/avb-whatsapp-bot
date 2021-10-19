// Imports
import type Bot from 'ts-wapp'
import type { ITarget } from 'ts-wapp/dist/utils/types.js'

/*
##########################################################################################################################
#                                                      PYTHON API CLASS                                                  #
##########################################################################################################################
*/

// Python API Class
export default class PyAPI {
  bot: Bot
  conn: boolean
  target: ITarget

  constructor (bot: Bot) {
    Object.defineProperty(this, 'bot',
      { get() { return bot } }
    )

    // Set Python API Address
    this.target = {
      addr: 'http://localhost:1516/i',
      auth: {
        user: 'gusal2.avb.whatsapp',
        password: 'ert2tyt3tQ3423rubu99ibasid8hya8da76sd'
      }
    }

    // Set Connection Status Object
    this.conn = undefined
  }

  // Cycle Reference
  get api() { return this.bot.api }
  get misc() { return this.bot.misc }

  // Check Connection
  async link(): Promise<boolean> {
    // test connection
    const [, requestError] = await this.api.reqs(this.target, null)
    const conn = !requestError
    // check result
    if (this.conn !== conn) {
      const l1 = 'Connection with Python Established'
      const l2 = 'No Connection with Python'
      const log = conn ? l1 : l2
      await this.bot.log(log)
      this.conn = conn
      // Send Message to Admin
      await this.bot.sends('anthony', log, 'py_conn_status')
    }
    // return result
    return conn
  }

  // Start Interface App
  async start() {
    try {
      const cycle = async () => {
        while (true) {
          await this.misc.sync.wait(1000)
          await this.link()
        }
      }
      cycle()
    } catch { return false }
    // return success
    return true
  }
}
