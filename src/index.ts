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
import Laminador from './utils/laminador.js'
import PyAPI from './utils/pyapi.js'
import cron from 'node-cron'
import fs from 'fs'

/*
##########################################################################################################################
#                                                         BOT INIT                                                       #
##########################################################################################################################
*/

// Create Instance of Bot
const Avbot = new Bot('avbot')

// Create Instance of Laminador
const Lam = new Laminador(Avbot)

// Create Instance of Python API
const pyApi = new PyAPI(Avbot)

// Set Bot Contacts File
Avbot.wapp.setContactsList(
  JSON.parse(
    fs.readFileSync('./private/contacts.bot.json').toString()
  ) as Record<string, string>
)

// Set API Listen Port and Authentication
Avbot.api.port(1615).user('avb.whatsapp').password(
  'ert2tyt3tQ3423rubu99ibasid8hya8da76sd'
)

/*
##########################################################################################################################
#                                                        BOT METHODS                                                     #
##########################################################################################################################
*/

// Responde Agradecimento
Avbot.add('cool_feedback',
  message => message.clean().match(/^\s*(obrigado|valeu)\s*$/),
  async message => {
    await message.quote('Estou as ordens! 😉🤝', 'cool_feedback')
  }
)

// Producao Trefila
Avbot.add('prod_trf',
  message => message.clean().match(/^\s*(producao(\s+))?trefila\s*$/),
  async message => {
    await message.quote(Avbot.chat.gotIt, 'got_it')
    await message.send(Lam.getTref(), 'bot::prod_trf')
  }
)

// Producao Laminador
Avbot.add('prod_lam',
  message => message.clean().match(/^\s*(producao(\s+))?laminador\s*$/),
  async message => {
    await message.quote(Avbot.chat.gotIt, 'got_it')
    await message.send(Lam.getProd(), 'bot::prod_lam')
  }
)

// Producao do Mes Laminador
Avbot.add('prod_mes_lam',
  message => message.clean().match(/^\s*producao(\s+)(do(\s+))?mes((\s+)laminador)?\s*$/),
  async message => {
    await message.quote(Avbot.chat.gotIt, 'got_it')
    await message.send(Lam.getProdMes(), 'bot::prod_mes_lam')
  }
)

// Responde Pergunta Geral do Usuario
Avbot.add('else', async message => {
  await message.quote(Avbot.chat.askPython.asking, 'asking_py')
  Lam.postData({ question: message.clean() })
    .catch(async error => {
      await Avbot.bot.log(`Error(admin::exec) Throw(${error})`)
      await message.send(Avbot.bot.chat.error.network, 'error_in_request')
    })
    .then(async answer => {
      if (!Avbot.misc.guards.is.string(answer)) {
        await Avbot.bot.log('Error(admin::exec) Throw(bad response)')
        await message.send(Avbot.bot.chat.error.network, 'error_in_request')
        return
      }
      await message.quote(Avbot.chat.askPython.finally, 'got_py_response')
      await message.send(answer, 'py_response')
    })
})

// Cron Scheduled Messages
cron.schedule('7 */1 * * *', async () => {
  // Producao Trefila Grupo
  await Avbot.sends('grupo_trefila', Lam.getTref(), 'cron::prod_trf')
  // Producao Laminador Calegari
  await Avbot.sends('calegari', Lam.getProd(), 'cron::prod_lam_calegari')
})

/*
##########################################################################################################################
#                                                        START BOT                                                       #
##########################################################################################################################
*/

// Create Instance of Venom
await Avbot.start()

// Start Python API
await pyApi.start()

// Send Message to Admin
await Avbot.sends('anthony', 'Node Avbot Started!', 'bot_start')

/*
##########################################################################################################################
#                                                          END                                                           #
##########################################################################################################################
*/
