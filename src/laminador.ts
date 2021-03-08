// Imports
import type Bot from './core.js'

/*
##########################################################################################################################
#                                                     CLASSE LAMINADOR                                                   #
##########################################################################################################################
*/

export default class Laminador {
  bot: Bot
  round?(number: number, precision?: number): number

  constructor(bot: Bot) {
    this.bot = bot
    this.round = bot.misc.round
  }

  getData(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.bot.misc.axios.get(url)
        .catch(err => reject(this.bot.chat.error.network))
        .then(val => val ? resolve(val.data) : reject(this.bot.chat.error.network))
    })
  }

  async putData(quest: Record<string, any> ): Promise<string> {
    return new Promise((resolve, reject) => {
      this.bot.misc.axios.post(
          'http://127.0.0.1:3000/questions',
          quest
        )
        .catch(err => reject(this.bot.chat.error.network))
        .then(val => val ? resolve(val.data) : reject(this.bot.chat.error.network))
    })
  }

  /*
  ##########################################################################################################################
  #                                                      PRODUCAO MES                                                      #
  ##########################################################################################################################
  */

  async getProdMes(): Promise<string> {
    return new Promise(resolve => {
      this.getData('http://127.0.0.1:3000/api/prod_lam_quente')
        .catch(erro => resolve(erro))
        .then(dados => {
          try {
            const meses = [
              'Janeiro', 'Fevereiro', 'Março',
              'Abril', 'Maio', 'Junho',
              'Julho', 'Agosto', 'Setembro',
              'Outubro', 'Novembro', 'Dezembro'
            ]
            const mes = meses[Number(String(dados[0]['data']).substring(3, 5)) - 1]
            let total = 0

            // Create Message String
            let info = `*Produção do mês de ${mes}*\n`
            for (const i in dados) {
              const dado = dados[i]
              dado['peso'] *= 1/1000
              dado['data'] = String(dado['data']).substring(0, 2)
              info += `\nDia ${dado['data']}: *${this.round(dado['peso'])}t*`
              total += dado['peso']
            }
            info += `\nTotal no mês: *${this.round(total)} Toneladas*`
            info += `\nMédia diária: *${this.round(total/dados.length)} Ton/dia*`

            // Resolve
            resolve(info)
            return

          } catch (err) {
            console.log(`Throw(__main__::Laminador.getProdMes) Catch(${err})`)
            resolve(this.bot.chat.error.network)
          }
        })
    })
  }

  /*
  ##########################################################################################################################
  #                                                      PRODUCAO DIA                                                      #
  ##########################################################################################################################
  */

  async getProd(): Promise<string> {
    return new Promise(resolve => {
      // Resquest Data
      Promise.all([
        this.getData('http://127.0.0.1:3000/api/furnace'),
        this.getData('http://127.0.0.1:3000/api/mill')
      ])
        .catch(erro => resolve(erro))
        .then(dados => {
          try {
            // Parse Data
            let blbp = dados[0]['QTD_PECAS']
            if (dados[1]['COBBLES'] > 0) blbp = this.round(blbp / dados[1]['COBBLES'])
            const uhp = this.round(dados[0]['ULTIMA_HORA_PESO'], 1)
            const hap = this.round(dados[0]['ATUAL_HORA_PESO'], 1)
            const tp = this.round(dados[0]['TEMPO_PARADO'])
            const pt = this.round(dados[0]['PESO_TOTAL'], 1)
            const vm = this.round(dados[0]['VAZAO_MEDIA'], 1)
            const rh = this.round(dados[0]['RITIMO_HORA'])
            const rd = this.round(dados[0]['RITIMO_DIA'])
            const u = this.round((dados[0]['UTIL'] * 100), 1)
            const luh = this.round(dados[0]['ULTIMA_HORA_PECAS'])
            const lha = this.round(dados[0]['ATUAL_HORA_PECAS'])
            const ld = this.round(dados[0]['QTD_PECAS'])
            const cb = this.round(dados[1]['COBBLES'])

            // Create Message String
            const producao = `\n` +
              `🤖 *Produção Laminador* 👾\n\n` +
              `✅ Produção na última hora: *${uhp}t*\n` +
              `✅ Produção na hora atual: *${hap}t*\n` +
              `⚠️ Tempo de paradas: ${tp} min\n` +
              `✅ Produção do dia: *${pt}t*\n` +
              `💰 Vazão média: *${vm}t/h*\n` +
              `📈 Ritmo da Hora: *${rh}t*\n` +
              `📈 Ritmo do dia: *${rd}t*\n` +
              `📊 Utilização: *${u}%*\n` +
              `➿ Laminados na *última hora: ${luh}*\n` +
              `➿ Laminados na *hora atual: ${lha}*\n` +
              `💵 Laminados no *dia: ${ld}*\n` +
              `➿ BL/BP do dia: *${blbp}*\n` +
              `💸 Sucatas total no dia: *${cb}*\n`

            // Resolve
            resolve(producao)
            return

          } catch (err) {
            console.log(`Throw(__main__::Laminador.getProd) Catch(${err})`)
            resolve(this.bot.chat.error.network)
          }
        })
    })
  }

  /*
  ##########################################################################################################################
  #                                                   PRODUCAO DIA TREFILA                                                 #
  ##########################################################################################################################
  */

  async getTref(): Promise<string> {
    return new Promise(resolve => {
      // Request Data
      this.getData('http://127.0.0.1:3000/api/trf')
        .catch(erro => resolve(erro))
        .then(dados => {
          try {
            // Parse Data
            const p02 = this.round(!dados['p02'] ? 0 : (dados['p02'] / 1000), 1)
            const p03 = this.round(!dados['p03'] ? 0 : (dados['p03'] / 1000), 1)
            const p04 = this.round(!dados['p04'] ? 0 : (dados['p04'] / 1000), 1)
            const p05 = this.round(!dados['p05'] ? 0 : (dados['p05'] / 1000), 1)
            const ps = p02 + p03 + p04 + p05
            const u02 = this.round(!dados['u02'] ? 0 : (dados['u02'] * 100), 1)
            const u03 = this.round(!dados['u03'] ? 0 : (dados['u03'] * 100), 1)
            const u04 = this.round(!dados['u04'] ? 0 : (dados['u04'] * 100), 1)
            const u05 = this.round(!dados['u05'] ? 0 : (dados['u05'] * 100), 1)
            const us = this.round((u02 + u03 + u04 + u05) / 4)
            const t02 = this.round(!dados['t02'] ? 0 : (dados['t02'] / 60), 1)
            const t03 = this.round(!dados['t03'] ? 0 : (dados['t03'] / 60), 1)
            const t04 = this.round(!dados['t04'] ? 0 : (dados['t04'] / 60), 1)
            const t05 = this.round(!dados['t05'] ? 0 : (dados['t05'] / 60), 1)
            const ts = t02 + t03 + t04 + t05
            const pt02 = this.round((0.04000 * (u02 / 100) * (dados['s'] / 60)), 2)
            const pt03 = this.round((0.05714 * (u03 / 100) * (dados['s'] / 60)), 2)
            const pt04 = this.round((0.05000 * (u04 / 100) * (dados['s'] / 60)), 2)
            const pt05 = this.round((0.04000 * (u05 / 100) * (dados['s'] / 60)), 2)
            const pts = pt02 + pt03 + pt04 + pt05
            const rpts = this.round(((pts / dados['SEC']) * 86400), 1)

            // Create Message String
            const message = `\n` +
              `🤖 *Produção Laminador a Frio* 👾\n\n` +
              `✅ Produção do dia M02: *${p02}t*\n` +
              `✅ Produção do dia M03: *${p03}t*\n` +
              `✅ Produção do dia M04: *${p04}t*\n` +
              `✅ Produção do dia M05: *${p05}t*\n` +
              `✅ *Produção total do dia: ${ps}t*\n` +
              `📊 Utilização M02: *${u02}%*\n` +
              `📊 Utilização M03: *${u03}%*\n` +
              `📊 Utilização M04: *${u04}%*\n` +
              `📊 Utilização M05: *${u05}%*\n` +
              `📊 *Utilização global: ${us}%*\n` +
              `⚠️ Tempo parado M02: *${t02}* horas\n` +
              `⚠️ Tempo parado M03: *${t03}* horas\n` +
              `⚠️ Tempo parado M04: *${t04}* horas\n` +
              `⚠️ Tempo parado M05: *${t05}* horas\n` +
              `⚠️ *Tempo total paradas: ${ts}h*\n` +
              `✅ Produção teórica M02: *${pt02}t*\n` +
              `✅ Produção teórica M03: *${pt03}t*\n` +
              `✅ Produção teórica M04: *${pt04}t*\n` +
              `✅ Produção teórica M05: *${pt05}t*\n` +
              `✅ *Produção teórica total: ${pts}t*\n` +
              `📈 *Ritmo produção teórica total: ${rpts}t*\n`

            // Resolve
            resolve(message)
            return

          } catch (err) {
            console.log(`Throw(__main__::Laminador.getProd) Catch(${err})`)
            resolve(this.bot.chat.error.network)
          }
        })
    })
  }
}

/*
##########################################################################################################################
#                                                           END                                                          #
##########################################################################################################################
*/
