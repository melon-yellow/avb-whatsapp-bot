/*
##########################################################################################################################
#                                                       ACESSORIES                                                       #
##########################################################################################################################
*/

// Imports
import axios from 'axios'
import express from 'express'
import requestIp from 'request-ip'
import bodyParser from 'body-parser'
import basicAuth from 'express-basic-auth'

/*
##########################################################################################################################
#                                                      MISCELLANEOUS                                                     #
##########################################################################################################################
*/

// Miscellaneous Class
export default class Miscellaneous {

  axios = axios
  express = express
  requestIp = requestIp
  bodyParser = bodyParser
  basicAuth = basicAuth

  // Allow Info Inside Misc
  get misc() {
    return this
  }

  // Get Date
  get timestamp() {
    return (
      new Date()
      .toLocaleString(
        'pt-BR', {
          timeZone: 'America/Fortaleza'
        }
      )
    )
  }

  // Wait Seconds
  wait(sec: number): Promise<void> {
    const wait = res => setTimeout(res, sec * 1000)
    return new Promise(wait)
  }

  // Get Random Item of Array
  rand(arr: Record<string | number, any> ): any {
    const karr = Object.keys(arr)
    const k = karr[Math.floor(Math.random() * karr.length)]
    return arr[k]
  }

  round(number: number, precision = 0): number {
    return parseFloat(number.toFixed(precision))
  }

  // Try something
  try (
    repeat = 10,
    delay = 1,
    exec = () => null,
    verify = (res: unknown) => true
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      let i = 0
      while (i < repeat) {
        if (i > 0) await this.wait(delay)
        let res = await exec()
        let cond = await verify(res)
        if (cond) {
          resolve(res)
          return null
        }
        i++
      }
      reject(null)
    })
  }
}

/*
##########################################################################################################################
#                                                         END                                                            #
##########################################################################################################################
*/
