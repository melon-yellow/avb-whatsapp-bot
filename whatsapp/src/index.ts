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
import * as actions from './modules/actions.js'
import Laminador from './modules/laminador.js'
import PyAPI from './modules/pyapi.js'
import cron from 'node-cron'
import fs from 'fs'

/*
##########################################################################################################################
#                                                     INSTANCE CLASSES                                                   #
##########################################################################################################################
*/

// Create Instance of Bot
const avbot = new Bot('avbot')

// Create Instance of Laminador
const lam = new Laminador(avbot)

// Create Instance of Python API
const pyApi = new PyAPI(avbot)

/*
##########################################################################################################################
#                                                        SET OPTIONS                                                     #
##########################################################################################################################
*/

// Set Venom Options
avbot.wapp.interface.setOptions({
  browserArgs: JSON.parse(
    fs.readFileSync('./config/browser.args.json').toString()
  ).args as string[]
})

// Set Bot Contacts File
avbot.wapp.setContactsList(
  JSON.parse(
    fs.readFileSync('./config/bot.contacts.json').toString()
  ) as Record<string, string>
)

/*
##########################################################################################################################
#                                                         READ ENV                                                       #
##########################################################################################################################
*/

// Set API Listen Port and Authentication
avbot.api.port(
  Number(process.env.WHATSAPP_PORT)
)

// Set All Users
Array(
  Number(process.env.WHATSAPP_USERS)
).forEach((_v, i) => {
  avbot.api.addUser({
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

// Start Python API
await pyApi.start()

// Send Message to Admin
await avbot.sends({ to: 'anthony', text: 'Node Avbot Started!', log: 'bot_start' })

/*
##########################################################################################################################
#                                                          END                                                           #
##########################################################################################################################
*/
