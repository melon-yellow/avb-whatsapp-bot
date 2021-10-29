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
const avbot = new Bot('avbot')

// Create Instance of Laminador
const lam = new Laminador(avbot)

// Create Instance of Python API
const pyApi = new PyAPI(avbot)

// Set Bot Contacts File
avbot.wapp.setContactsList(
  JSON.parse(
    fs.readFileSync('./contacts.bot.json').toString()
  ) as Record<string, string>
)

// Set API Listen Port and Authentication
avbot.api.port(Number(process.env.WHATSAPP_PORT ?? 3000))
  .addUser({
    user: process.env.WHATSAPP_USER_1 ?? 'u1',
    password: process.env.WHATSAPP_USER_1_PW ?? 'u1p' 
  }).addUser({
    user: process.env.WHATSAPP_USER_2 ?? 'u2',
    password: process.env.WHATSAPP_USER_2_PW ?? 'u2p'
  })

/*
##########################################################################################################################
#                                                        BOT METHODS                                                     #
##########################################################################################################################
*/

// Responde Agradecimento
avbot.add('cool_feedback',
  message => message.clean().match(/^\s*(obrigado|valeu)\s*$/),
  async message => {
    await message.quote('Estou as ordens! 😉🤝', 'cool_feedback')
  }
)

// Producao Trefila
avbot.add('prod_trf',
  message => message.clean().match(/^\s*(producao(\s+))?trefila\s*$/),
  async message => {
    await message.quote(avbot.chat.gotIt, 'got_it')
    await message.send(lam.getTref(), 'bot::prod_trf')
  }
)

// Producao Laminador
avbot.add('prod_lam',
  message => message.clean().match(/^\s*(producao(\s+))?laminador\s*$/),
  async message => {
    await message.quote(avbot.chat.gotIt, 'got_it')
    await message.send(lam.getProd(), 'bot::prod_lam')
  }
)

// Producao do Mes Laminador
avbot.add('prod_mes_lam',
  message => message.clean().match(/^\s*producao(\s+)(do(\s+))?mes((\s+)laminador)?\s*$/),
  async message => {
    await message.quote(avbot.chat.gotIt, 'got_it')
    await message.send(lam.getProdMes(), 'bot::prod_mes_lam')
  }
)

// Responde Pergunta Geral do Usuario
avbot.add('else', async message => {
  await message.quote(avbot.chat.askPython.asking, 'asking_py')
  lam.postData({ question: message.clean() })
    .catch(async error => {
      await avbot.bot.log(`Error(admin::exec) Throw(${error})`)
      await message.send(avbot.bot.chat.error.network, 'error_in_request')
    })
    .then(async answer => {
      if (!avbot.misc.guards.is.string(answer)) {
        await avbot.bot.log('Error(admin::exec) Throw(bad response)')
        await message.send(avbot.bot.chat.error.network, 'error_in_request')
        return
      }
      await message.quote(avbot.chat.askPython.finally, 'got_py_response')
      await message.send(answer, 'py_response')
    })
})

// Cron Scheduled Messages
cron.schedule('7 */1 * * *', async () => {
  // Producao Trefila Grupo
  // await Avbot.sends('grupo_trefila', Lam.getTref(), 'cron::prod_trf')
  // Producao Laminador Calegari
  await avbot.sends('calegari', lam.getProd(), 'cron::prod_lam_calegari')
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
await avbot.sends('anthony', 'Node Avbot Started!', 'bot_start')

/*
##########################################################################################################################
#                                                          END                                                           #
##########################################################################################################################
*/
