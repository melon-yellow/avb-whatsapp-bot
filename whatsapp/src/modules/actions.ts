
/*
##########################################################################################################################
#                                                     CLASSE LAMINADOR                                                   #
##########################################################################################################################
*/

// Imports
import type Bot from 'ts-wapp'
import Laminador from './laminador.js'

// Import Axios
import axios from 'axios'

// Import Super-Guards
import { is } from 'ts-misc/dist/utils/guards.js'

/*
##########################################################################################################################
#                                                     CLASSE LAMINADOR                                                   #
##########################################################################################################################
*/

// Add Actions
export function load(p: { bot: Bot, lam: Laminador }) {
  // Bot Actions
  const { bot, lam } = p

  /*
  ##########################################################################################################################
  #                                                     CLASSE LAMINADOR                                                   #
  ##########################################################################################################################
  */

  // Responde Agradecimento
  bot.add({
    action: 'coolFeedback',
    condition: message => message.clean().match(
      /^\s*(obrigado|valeu)\s*$/
    ),
    do: async message => {
      await message.quote({
        text: 'Estou as ordens! 😉🤝',
        log: 'avbot::coolFeedback'
      })
    }
  })

  /*
  ##########################################################################################################################
  #                                                     CLASSE LAMINADOR                                                   #
  ##########################################################################################################################
  */

  // Producao Trefila
  bot.add({
    action: 'producaoTrefila',
    condition: message => message.clean().match(
      /^\s*(producao(\s+))?trefila\s*$/
    ),
    do: async message => {
      await message.quote({
        text: bot.chat.gotIt,
        log: 'bot::gotIt'
      })
      await message.send({
        text: lam.relatorioProducaoTrefila(),
        log: 'Laminador::relatorioProducaoTrefila'
      })
    }
  })

  /*
  ##########################################################################################################################
  #                                                     CLASSE LAMINADOR                                                   #
  ##########################################################################################################################
  */

  // Producao Laminador
  bot.add({
    action: 'producaoLaminador',
    condition: message => message.clean().match(
      /^\s*(producao(\s+))?laminador\s*$/
    ),
    do: async message => {
      await message.quote({
        text: bot.chat.gotIt,
        log: 'bot::gotIt'
      })
      await message.send({
        text: lam.relatorioProducaoLaminador(),
        log: 'Laminador::relatorioProducaoLaminador'
      })
    }
  })

  /*
  ##########################################################################################################################
  #                                                     CLASSE LAMINADOR                                                   #
  ##########################################################################################################################
  */

  // Producao do Mes Laminador
  bot.add({
    action: 'producaoLaminadorMes',
    condition: message => message.clean().match(
      /^\s*producao(\s+)(do(\s+))?mes((\s+)laminador)?\s*$/
    ),
    do: async message => {
      await message.quote({
        text: bot.chat.gotIt,
        log: 'bot::gotIt'
      })
      await message.send({
        text: lam.relatorioProducaoLaminadorMes(),
        log: 'Laminador::relatorioProducaoLaminadorMes'
      })
    }
  })

  /*
  ##########################################################################################################################
  #                                                     CLASSE LAMINADOR                                                   #
  ##########################################################################################################################
  */

  // Responde Pergunta Geral do Usuario
  bot.add({
    action: 'else',
    do: async message => {
      // Send Asting Python
      await message.quote({
        text: bot.chat.askPython.asking,
        log: 'bot::askingPython'
      })
      // Request Python
      axios.post(
        process.env.NLP_QUESTIONS,
        { question: message.clean() }
      )
        .catch(async error => {
          await message.send({
            text: bot.chat.error.network,
            log: 'bot::gotError'
          })
          await bot.log(`Throw(bot::actions[else]::askPython) Catch(${error})`)
        })
        .then(async answer => {
          try {
            if (!answer) throw new Error('invalid response')
            const msg = answer.data
            if (!is.string(msg)) throw new Error('invalid response')
            await message.quote({
              text: bot.chat.askPython.finally,
              log: 'bot::gotResponse'
            })
            await message.send({
              text: msg,
              log: 'bot::pythonResponse'
            })
          } catch (error) {
            await bot.log(`Throw(bot::actions[else]::pythonResponse) Catch(${error})`)
          }
        })
    }
  })
}

/*
##########################################################################################################################
#                                                     CLASSE LAMINADOR                                                   #
##########################################################################################################################
*/
