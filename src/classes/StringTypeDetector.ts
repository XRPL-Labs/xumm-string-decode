import * as URLSearchParams from '@ungap/url-search-params'
import * as URL from 'url'

import StringType from '../enums/StringType'

class StringTypeDetector {
  private input: string
  private originalInput: string
  private strippedInput: string
  private type: StringType
  private url = false
  private searchParams: URLSearchParams

  public static validHosts = ['xumm.app', 'xaman.app']

  public constructor(input: string) {
    this.input = input
    this.originalInput = input
    this.strippedInput = input
    this.type = this.parse()
  }

  private isValidHost = (host: string): boolean => {
    return StringTypeDetector.validHosts.includes(host)
  }

  private parse() : StringType {
    const uuidv4regExp = '[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}'
    const txHash = new RegExp(`^[A-F0-9]{64}$`, 'i')
    const uuid = new RegExp(`^${uuidv4regExp}$`, 'i')
    const pairing = new RegExp(`^${uuidv4regExp}.${uuidv4regExp}$`, 'i')
    const possibleAccountAddress = new RegExp(/[rX][rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz]{23,50}/)
    const possibleFamSeed = new RegExp(/(^s|:[ \t]s)[rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz]{20,}/)
    const possiblePrivateKey = new RegExp(/^(ED|00)([A-F0-9]{2}){32}$/i)
    const possibleTransactionBlob = new RegExp(/([A-F0-9]{2}){34,}/i)
    const possibleMnemonic = new RegExp(/([a-z]{2,}\s){11,24}[a-z]{2,}/i)
    const possiblePayId = new RegExp(/^(.*)\$([a-z0-9-_.]+.*)$/i)
    const possibleDestinationTag = new RegExp(/^(.+:[\t ]*)*([0-9]+)$/)

    try {
      const url = URL.parse(this.input)

      /**
       * Check for xumm/xaman deeplink syntax
       */
      if (this.isValidHost(url.host.toLowerCase().replace(/^www\./, '') ) && url.pathname !== null) {
        const xummUrl = url.pathname.replace(/\/+/g, '/').replace(/^\//, '').split('/')
        if (xummUrl.length > 1) {
          this.strippedInput = decodeURI(xummUrl[1])

          if (uuid.test(this.strippedInput)) {
            // xummUrl[0].toLowerCase() === 'sign'
            return StringType.XummPayloadReference
          }
          if (pairing.test(this.strippedInput)) {
            // xummUrl[0].toLowerCase() === 'pair'
            return StringType.XummPairingToken
          }
          if (xummUrl[0].toLowerCase() === 'tx' && txHash.test(this.strippedInput)) {
            return StringType.XrplTransactionHash
          }
          if (xummUrl[0].toLowerCase() === 'detect') {
            this.input = url.pathname.replace(/\/+/g, '/').split('/').slice(2).join('/') + (url.search || '')
          }
        }
      }

      /**
       * Check for "full Ripple URI" syntax
       */
      const searchParams = new URLSearchParams(url.query || '')
      if (searchParams.get('to')) {
        this.url = true
        this.strippedInput = searchParams.toString()
        this.searchParams = searchParams
      } else if (url.search !== '' && possibleAccountAddress.test(url.search)) {
        this.strippedInput = url.search.substring(1)
      }

      if (url.path.toLowerCase().match(/detect\/xapp/) && this.isValidHost(url.hostname)) {
        const xappName = url.path.toLowerCase().match(/xapp:([^/?]+)/)
        if (xappName) {
          this.strippedInput = xappName[1]
          this.searchParams = searchParams

          return StringType.XummXapp
        }
      }

      if (url.path.toLowerCase().match(/detect\/secret/) && this.isValidHost(url.hostname)) {
        if (typeof searchParams.get('type') === 'string' && typeof searchParams.get('name') === 'string') {
          if (searchParams.get('type').toLowerCase() === 'alt-family-seed') {
            this.searchParams = searchParams
            this.strippedInput = searchParams.get('name')

            return StringType.XrplAltFamilySeedAlphabet
          }
        }

        return StringType.Invalid
      }

      if (url.path.toLowerCase().match(/detect\/feature:([a-z0-9-]+)/) && this.isValidHost(url.hostname)) {
        if (typeof searchParams.get('type') === 'string' && searchParams.get('type') !== '') {
          this.strippedInput = url.path.toLowerCase().match(/detect\/feature:([a-z0-9-]+)/)[1]
          this.searchParams = searchParams

          return StringType.XummFeature
        }
      }
    } catch {
      // Continue
    }

    if (possibleAccountAddress.test(this.strippedInput) && this.strippedInput.trim().match(/[\r\n]/)) {
      return StringType.XrplDestination
    }

    if (possibleFamSeed.test(this.strippedInput)) {
      this.strippedInput = this.strippedInput.split(':').reverse()[0].trim()
      return StringType.XrplSecret
    }

    if (possiblePrivateKey.test(this.strippedInput)) {
      return StringType.XrplSecret
    }

    let uriDecodedStrippedInput
    try {
      uriDecodedStrippedInput = decodeURIComponent(this.strippedInput)
    } catch{
      // Continue
    }

    if (uriDecodedStrippedInput && possiblePayId.test(uriDecodedStrippedInput)) {
      const payIdParts = possiblePayId.exec(uriDecodedStrippedInput.toLowerCase())
      try {
        const payIdUrl = URL.parse('https://' + payIdParts[2] + '/' + payIdParts[1])
        let pathValid = payIdUrl.path === null
        if (payIdParts[1] === payIdUrl.path.replace(/^\/+/, '').replace(/\/+$/, '')) {
          pathValid = true
        }
        if (payIdUrl.host && pathValid) {
          this.strippedInput = payIdParts[1] + '$' + payIdParts[2]
          return StringType.PayId
        }
      } catch{
        // Continue
      }
    }

    if (possibleTransactionBlob.test(this.strippedInput)) {
      try {
        const hexToText = Buffer.from(this.strippedInput, 'hex').toString('utf-8')
        const textToJson = JSON.parse(hexToText)
        if (textToJson !== null && Object.keys(textToJson).length > 0) {
          return StringType.XrplTransactionTemplate
        }
      } catch {
        // Continue
      }

      return StringType.XrplSignedTransaction
    }

    if (possibleAccountAddress.test(this.strippedInput)) {
      if(this.input.slice(0, 10) === 'xrpl://to=') {
        this.input = this.input.slice(7)
      }
      const re = /^[a-z]+:[ ]*([rX][rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz]{23,50})/i
      this.input = this.input.replace(re, x => {
        return x.split(':').slice(1).join(':').trim()
      })
      this.strippedInput = possibleAccountAddress.exec(this.strippedInput)[0]
      return StringType.XrplDestination
    }

    if (possibleMnemonic.test(this.strippedInput)) {
      this.strippedInput = possibleMnemonic.exec(this.strippedInput)[0].replace(/\s/g, ' ').trim()
      return StringType.XrplSecret
    }

    if(possibleDestinationTag.test(this.strippedInput)){
      const dTagParts = possibleDestinationTag.exec(this.strippedInput)
      const tag = Number(dTagParts[2])
      if (tag >= 0 && tag < Math.pow(2, 32)){
        this.strippedInput = String(tag)
        return StringType.XrplDestinationTag
      }
    }

    if(this.strippedInput.slice(0, 19) === 'xumm://translation/' && uuid.test(this.strippedInput.slice(19))){
      this.strippedInput = this.strippedInput.slice(19)
      return StringType.XummTranslation
    }

    if (
      (this.strippedInput.slice(0, 7) === 'xumm://' || this.strippedInput.slice(0, 8) === 'xaman://') &&
      uuid.test(this.strippedInput.slice(this.strippedInput.indexOf('://') + 3))
    ) {
      this.strippedInput = this.strippedInput.slice(this.strippedInput.indexOf('://') + 3)
      return StringType.XummPayloadReference
    }

    return StringType.Invalid
  }

  public getType() : StringType {
    return this.type
  }

  public getTypeName() : string {
    return StringType[this.getType()]
  }

  public getStrippedInput() : string {
    return this.strippedInput
  }

  public getInput() : string {
    return this.originalInput
  }

  public getRawInput() : string {
    return this.input
  }

  public getSearchParams() : URLSearchParams {
    return this.searchParams
  }

  public isUrl() : boolean {
    return this.url
  }
}

export default StringTypeDetector
