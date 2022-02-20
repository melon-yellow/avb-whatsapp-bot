/*
##########################################################################################################################
#                                                        TS-AVBOT                                                        #
##########################################################################################################################
#                                                                                                                        #
#                                                   AVB Whatsapp Bot                                                     #
#                                          Multi-language API for Whatsapp Bot                                           #
#                                 ---------------- Python3 -- NodeJS ----------------                                    #
#                                                * Under Development *                                                   #
#                                   https://github.com/melon-yellow/avb-whatsapp-bot                                     #
#                                                                                                                        #
##########################################################################################################################
#                                                        MAIN CODE                                                       #
##########################################################################################################################
*/

// Imports
import Bot from 'ts-wapp'

// Import Miscellaneous
import { is } from 'ts-misc/dist/utils/guards.js'

// Import Express
import express from 'express'

// Imports FileSystem
import fs from 'fs'

// Modules
import Laminador from './modules/laminador.js'
import * as actions from './modules/actions.js'
import * as schedule from './modules/schedule.js'

/*
##########################################################################################################################
#                                                     INSTANCE CLASSES                                                   #
##########################################################################################################################
*/

// Create Instance of Bot
const avbot = new Bot('avbot')

// Create Instance of Laminador
const lam = new Laminador(avbot)

/*
##########################################################################################################################
#                                                         READ ENV                                                       #
##########################################################################################################################
*/

// Set Network API
const app = express()

// Set Network Endnode
avbot.network.route({
  route: 'whatsapp',
  app: app
})

// Set Network API Port
const port = Number(process.env.WHATSAPP_PORT)

// Set Network Authentication
Array.from(Array(
  Number(process.env.WHATSAPP_USERS)
)).forEach((_v, i) => {
  // Assign User
  Object.assign(avbot.network.users, {
    [process.env[`WHATSAPP_USER_${i + 1}`]]:
     process.env[`WHATSAPP_PASSWORD_${i + 1}`]
  })
})

/*
##########################################################################################################################
#                                                        START BOT                                                       #
##########################################################################################################################
*/

// Get Contacts Function
const getContacts = (path: string) => {
  const obj = JSON.parse(fs.readFileSync(path).toString())
  const cond = is.object(obj) && is.object.of.string<typeof obj>(obj)
  return (cond ? obj : {}) as Record<string, string>
}

// Set Bot Contacts File
Object.assign(avbot.wapp.contacts,
  getContacts('./private/bot.contacts.json')
)

// Load Bot Actions
actions.load({ bot: avbot, lam: lam })
schedule.load({ bot: avbot, lam: lam })

/*
##########################################################################################################################
#                                                        START BOT                                                       #
##########################################################################################################################
*/

// Create Instance of Venom
await avbot.start()

// Listen on Specified Port
app.listen(port)

// Send Message to Admin
await avbot.sends({
  to: 'avb.automacao.anthony',
  text: 'node bot started',
  log: 'bot::start'
})

/*
##########################################################################################################################
#                                                          END                                                           #
##########################################################################################################################
*/
