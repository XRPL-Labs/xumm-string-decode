import StringType from '../enums/StringType'
import * as URL from 'url'
import * as URLSearchParams from '@ungap/url-search-params'

class StringTypeDetector {
  private input: string
  private originalInput: string
  private strippedInput: string
  private type: StringType
  private url: boolean = false
  private searchParams: URLSearchParams

  public constructor(input: string) {
    this.input = input
    this.originalInput = input
    this.strippedInput = input
    this.type = this.parse()
  }

  private parse() : StringType {
    const uuidv4regExp = '[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}'
    const txHash = new RegExp(`^[A-F0-9]{64}$`, 'i')
    const uuid = new RegExp(`^${uuidv4regExp}$`, 'i')
    const pairing = new RegExp(`^${uuidv4regExp}\.${uuidv4regExp}$`, 'i')
    const possibleAccountAddress = new RegExp(/[rX][rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz]{23,50}/)
    const possibleFamSeed = new RegExp(/(^s|:[ \t]s)[rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz]{20,}/)
    const possiblePrivateKey = new RegExp(/^(ED|00)([A-F0-9]{2}){32}$/i)
    const possibleTransactionBlob = new RegExp(/([A-F0-9]{2}){34,}/i)
    const possibleMnemonic = new RegExp(/([a-z]{2,}\s){11,24}[a-z]{2,}/i)
    const possiblePayId = new RegExp(/^(.*)\$([a-z0-9-_\.]+.*)$/i)
    const possibleDestinationTag = new RegExp(/^(.+:[\t ]*)*([0-9]+)$/)

    try {
      const url = URL.parse(this.input)

      /**
       * Check for xumm deeplink syntax
       */
      if (url.host.toLowerCase().replace(/^www\./, '') === 'xumm.app' && url.pathname !== null) {
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
    } catch (e) {
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
    } catch (e) {
      //
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
      } catch (e) {
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
      } catch (e) {
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
