/*
##########################################################################################################################
#                                                        TS-AVBOT                                                        #
##########################################################################################################################
#                                                                                                                        #
#                                                   AVB Whatsapp Bot                                                     #
#                                          Multi-language API for Whatsapp Bot                                           #
#                                 ---------------- Python3 -- NodeJS ----------------                                    #
#                                                * Under Development *                                                   #
#                                     https://github.com/anthony-freitas/ts-avbot                                        #
#                                                                                                                        #
##########################################################################################################################
#                                                        MAIN CODE                                                       #
##########################################################################################################################
*/

// Imports
import Bot from 'ts-wapp'

// Import Express
import express from 'express'

// Imports Utils
import cron from 'node-cron'
import fs from 'fs'

// Modules
import * as actions from './modules/actions.js'
import Laminador from './modules/laminador.js'

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
#                                                        SET OPTIONS                                                     #
##########################################################################################################################
*/

// Set Bot Contacts File
avbot.wapp.setContactsList(
  JSON.parse(
    fs.readFileSync('./private/bot.contacts.json').toString()
  ) as Record<string, string>
)

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
Array(
  Number(process.env.WHATSAPP_USERS)
).forEach((_v, i) => {
  avbot.network.addUser({
    user: process.env[`WHATSAPP_USER_${i + 1}`],
    password: process.env[`WHATSAPP_PASSWORD_${i + 1}`]
  })
})

/*
##########################################################################################################################
#                                                        BOT METHODS                                                     #
##########################################################################################################################
*/

// Add Bot Actions
actions.add({ bot: avbot, lam: lam })

// Cron Scheduled Messages
cron.schedule('7 */1 * * *', async () => {
  // Producao Trefila Grupo
  await avbot.sends({ to: 'grupo_trefila', text: lam.getTref(), log: 'cron::prod_trf' })
  // Producao Laminador Calegari
  await avbot.sends({ to: 'calegari', text: lam.getProd(), log: 'cron::prod_lam_calegari' })
})

/*
##########################################################################################################################
#                                                        START BOT                                                       #
##########################################################################################################################
*/

// Create Instance of Venom
await avbot.start()

// Listen on Port Especified
app.listen(port)

// Send Message to Admin
await avbot.sends({ to: 'anthony', text: 'Node Avbot Started!', log: 'bot->start' })

/*
##########################################################################################################################
#                                                          END                                                           #
##########################################################################################################################
*/
