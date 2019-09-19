import {StringType} from '../enums/StringType'
import {URL} from 'url'

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
    const signRequest = new RegExp(`^${uuidv4regExp}$`, 'i')
    const pairing = new RegExp(`^${uuidv4regExp}\.${uuidv4regExp}$`, 'i')
    const possibleAccountAddress = new RegExp(/[rX][rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz]{23,50}/)
    const possibleFamSeed = new RegExp(/(^s|:[ \t])[rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz]{20,50}/)
    const possiblePrivateKey = new RegExp(/^(ED|00)([A-F0-9]{2}){32}$/i)
    const possibleTransactionBlob = new RegExp(/([A-F0-9]{2}){34,}/i)
    const possibleMnemonic = new RegExp(/([a-z]{2,}\s){11,24}[a-z]{2,}/i)

    try {
      const url = new URL(this.input)

      /**
       * Check for xumm deeplink syntax
       */
      if (url.host.toLowerCase().replace(/^www\./, '') === 'xumm.app' && url.pathname !== null) {
        const xummUrl = url.pathname.replace(/\/+/g, '/').replace(/^\//, '').split('/')
        if (xummUrl.length > 1) {
          this.strippedInput = decodeURI(xummUrl[1])

          if (signRequest.test(this.strippedInput)) {
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
            this.input = url.pathname.replace(/\/+/g, '/').split('/').slice(2).join('/') + url.search
          }
        }
      }

      /**
       * Check for "full Ripple URI" syntax
       */
      if (url.searchParams.get('to')) {
        this.url = true
        this.strippedInput = url.searchParams.toString()
        this.searchParams = url.searchParams
      } else if (url.search !== '' && possibleAccountAddress.test(url.search)) {
        this.strippedInput = url.search.substring(1)
      }
    } catch (e) {
      // Continue
    }

    if (possibleFamSeed.test(this.strippedInput)) {
      this.strippedInput = this.strippedInput.split(':').reverse()[0].trim()
      return StringType.XrplSecret
    }

    if (possiblePrivateKey.test(this.strippedInput)) {
      return StringType.XrplSecret
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
      this.input = this.input.replace(/^ripple:/, '')
      this.strippedInput = possibleAccountAddress.exec(this.strippedInput)[0]
      return StringType.XrplDestination
    }

    if (possibleMnemonic.test(this.strippedInput)) {
      this.strippedInput = possibleMnemonic.exec(this.strippedInput)[0].replace(/\s/g, ' ').trim()
      return StringType.XrplSecret
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
