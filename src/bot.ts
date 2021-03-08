/*
##########################################################################################################################
#                                                         AVBOT                                                          #
##########################################################################################################################
#                                                                                                                        #
#                                                     Avbot v1.2.2                                                       #
#                                          Multi-language API for Whatsapp Bot                                           #
#                             ---------------- Python3 -- Node.js -- MySQL ----------------                              #
#                                             This is a Development Server                                               #
#                                                 Powered by venom-bot                                                   #
#                                                                                                                        #
##########################################################################################################################
#                                                        MAIN CODE                                                       #
##########################################################################################################################
*/

// Imports
import Bot from './core.js'
import Laminador from './laminador.js'
import cron from 'node-cron'

/*
##########################################################################################################################
#                                                         START                                                          #
##########################################################################################################################
*/

// Create Bot Instance
const Avbot = new Bot()
// Create Laminador Instance
const Lam = new Laminador(Avbot)

// Producao Laminador
Avbot.add(
  'prod_lam',
  message => message.clean() === 'producao',
  async message => {
    await message.quote(Avbot.chat.gotIt, 'got_it')
    await message.send(await Lam.getProd(), 'bot::prod_lam')
  }
)

// Producao Trefila
Avbot.add(
  'prod_trf',
  message => message.clean() === 'trefila',
  async message => {
    await message.quote(Avbot.chat.gotIt, 'got_it')
    await message.send(await Lam.getTref(), 'bot::prod_trf')
  }
)

// Producao do Mes Laminador
Avbot.add(
  'prod_mes_lam',
  message => message.clean() === 'producao do mes',
  async message => {
    await message.quote(Avbot.chat.gotIt, 'got_it')
    await message.send(await Lam.getProdMes(), 'bot::prod_mes_lam')
  }
)

// Responde Agradecimento
Avbot.add(
  'cool_feedback',
  message => ['obrigado', 'valeu'].includes(message.clean()),
  async message => {
    await message.quote('Estou as ordens! 😉🤝🏾', 'cool_feedback')
  }
)

// Responde Pergunta Geral do Usuario
Avbot.add(
  'else',
  async message => {
    await message.quote(Avbot.chat.askPython.asking, 'asking_py')
    Lam.putData({
        question: message.clean()
      })
      .catch(async error => {
        await Avbot.bot.log(`Error(admin::exec) Throw(${error})`)
        await message.send(Avbot.bot.chat.error.network, 'error_in_request')
      })
      .then(async value => {
        if (!value) return false
        await message.quote(Avbot.chat.askPython.finally, 'got_py_response')
        await message.send(value, 'py_response')
      })
  }
)

// Cron Scheduled Messages
cron.schedule('59 */1 * * *', async () => {
  // Producao Trefila Grupo
  await Avbot.send(
    '558181061698-1580518561@g.us',
    await Lam.getTref(),
    'cron::prod_trf'
  )
  // Producao Laminador Calegari
  await Avbot.send(
    '559991536500@c.us',
    await Lam.getProd(),
    'cron::prod_lam_calegari'
  )
})

// Create Venom Instance
Avbot.start('avbot')

/*
##########################################################################################################################
#                                                          END                                                           #
##########################################################################################################################
*/
