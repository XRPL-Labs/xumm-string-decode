import StringTypeDetector from './StringTypeDetector'
import {
  XummPayloadReference,
  XummPairingToken,
  XrplDestination,
  XrplDestinationTag,
  XrplTransactionHash,
  XrplSecret,
  XrplSignedTransaction,
  XrplTransactionTemplate,
  PayId
} from '../types'
import SecretType from '../enums/SecretType'
import {tryUrlParams} from '../helpers'
import * as URL from 'url'
import * as URLSearchParams from '@ungap/url-search-params'

class StringDecoder {
  input: StringTypeDetector

  constructor(input: StringTypeDetector) {
    this.input = input
  }

  getXrplDestination() : XrplDestination {
    const result: XrplDestination = {to: this.input.getStrippedInput()}
    let searchParams: URLSearchParams

    if (!this.input.isUrl()) {
      if (this.input.getRawInput().split('&').length > 0 && this.input.getRawInput().split('=').length > 0) {
        // Try URI syntax
        let tryParseUri: string = this.input.getRawInput()
        if (this.input.getRawInput().match(/^\?/)) {
          tryParseUri = 'https://localhost/' + this.input.getRawInput()
        } else if (this.input.getRawInput().match(/^[a-z0-9\[\]]+=.+/)) {
          tryParseUri = 'https://localhost/?' + this.input.getRawInput()
        } else if (this.input.getRawInput().match(/^[rX][a-zA-Z0-9]{20,}/)) {
          tryParseUri = 'https://localhost/?to=' + this.input.getRawInput()
        }

        /**
         * Try invalid or non-URI syntax
         */
        if (this.input.getRawInput().match(/\?[a-zA-Z0-9_\[\]]+=.+/)
          && this.input.getRawInput().replace(/^\?/, '').split('?').length === 2) {
          // r9JynAPy1xUEW2bAYK36fy5dKKNNNKK1Z5?dt=123
          tryParseUri = 'https://localhost/?to=' + this.input.getRawInput().replace(/^\?/, '').replace(/\?/, '&')
        } else if (this.input.getRawInput().match(/^r[a-zA-Z0-9]{20,}[-: ]+[0-9]+$/)) {
          // rPdvC6ccq8hCdPKSPJkPmyZ4Mi1oG2FFkT:1234
          tryParseUri = 'https://localhost/?to=' + this.input.getRawInput().replace(/[-: ]+/, '&dt=')
        } else if (this.input.getRawInput().match(/\?r[a-zA-Z0-9]{20,}/)
          && !this.input.getRawInput().match(/[\?&]to=r[a-zA-Z0-9]{20,}/)) {
          // scheme://uri/folders?rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDY:123
          tryParseUri = this.input.getRawInput().replace(/\?/, '?to=')
        } else if (this.input.getRawInput().trim().match(/[\n\r]/)
          && this.input.getRawInput().match(/r[a-zA-Z0-9]{20,}.*[\r\n\t]+|[\r\n\t]+.*r[a-zA-Z0-9]{20,}/g)) {
          const to = this.input.getRawInput().match(/r[a-zA-Z0-9]{20,}/)
          const tag = this.input.getRawInput().slice(to.index + to[0].length).match(/[0-9]+/g)
          tryParseUri = 'https://localhost/?to=' + to[0] +
            (tag && typeof tag[0] === 'string' && tag[0] !== '' ? '&dt=' + tag[0] : '')
        }

        /**
         * Recover destination tag notation
         */
        if (tryParseUri.match(/[\?&]to=r[a-zA-Z0-9]{20,}[-: ]+[0-9]+/)
          && !tryParseUri.match(/[\?&](dt|tag|destinationtag)=/)) {
          tryParseUri = tryParseUri.replace(/([\?&]to=r[a-zA-Z0-9]{20,})[-: ]+([0-9]+)/, '$1&dt=$2')
        }

        /**
         * Try parsing
         */
        try {
          const url = URL.parse(tryParseUri)
          searchParams = new URLSearchParams(url.query || '')
        } catch (e) {
          // Continue
        }
      }
    } else {
      searchParams = this.input.getSearchParams()
    }

    if (searchParams && searchParams.has('to')) {
      const XrplDestinationOutput = {
        to: searchParams.get('to'),
        tag: <undefined>tryUrlParams(searchParams, ['tag', 'dt', 'dtag', 'destinationtag'], Number),
        invoiceid: <undefined>tryUrlParams(searchParams, ['invoice', 'invoiceid', 'invid', 'inv'], String),
        amount: <undefined>tryUrlParams(searchParams, ['amount'], String),
        currency: <string>tryUrlParams(searchParams, ['currency', 'iou'], String),
        issuer: <string>tryUrlParams(searchParams, ['issuer'], String)
      }

      if (XrplDestinationOutput.currency !== undefined
        && XrplDestinationOutput.issuer === undefined
        && XrplDestinationOutput.currency.split(':').length === 2) {
        const splitCurrency = XrplDestinationOutput.currency.split(':')
        if (splitCurrency[1].length === 3) {
          XrplDestinationOutput.issuer = splitCurrency[0]
          XrplDestinationOutput.currency = splitCurrency[1]
        } else if (splitCurrency[0].length === 3) {
          XrplDestinationOutput.currency = splitCurrency[0]
          XrplDestinationOutput.issuer = splitCurrency[1]
        }
      }

      return XrplDestinationOutput
    }

    return result
  }


  getXrplDestinationTag() : XrplDestinationTag {
    return {
      tag: Number(this.input.getStrippedInput())
    }
  }

  getXrplSecret() : XrplSecret {
    if (this.input.getStrippedInput().match(/^([a-z]{3,}\s){11,}[a-z]{3,}$/i)) {
      return {
        secretType: SecretType.Mnemonic,
        mnemonic: this.input.getStrippedInput().toLowerCase()
      }
    }

    if (this.input.getStrippedInput().match(/^s[rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz]{20,}/)) {
      return {
        secretType: SecretType.FamilySeed,
        familySeed: this.input.getStrippedInput()
      }
    }

    if (this.input.getStrippedInput().match(/^[A-F0-9]{66}$/)) {
      return {
        secretType: SecretType.Hex,
        hexPrivateKey: this.input.getStrippedInput().toUpperCase()
      }
    }
  }

  getXummPayloadReference() : XummPayloadReference {
    return {
      uuid: this.input.getStrippedInput()
    }
  }

  getXummPairingToken() : XummPairingToken {
    return {
      token: this.input.getStrippedInput()
    }
  }

  getPayId() : PayId {
    const payIdSplitted = this.input.getStrippedInput().split('$')
    const payIdAsUrl = URL.parse('https://' + payIdSplitted[1] + '/' + payIdSplitted[0])

    return {
      payId: this.input.getStrippedInput(),
      url: payIdAsUrl.href + (
        payIdAsUrl.path === '/'
          ? '.well-known/pay'
          : ''
      )
    }
  }

  getXrplTransactionHash() : XrplTransactionHash {
    return {
      txhash: this.input.getStrippedInput().trim()
    }
  }

  getXrplSignedTransaction() : XrplSignedTransaction {
    return {
      txblob: this.input.getStrippedInput().trim()
    }
  }

  getXrplTransactionTemplate() : XrplTransactionTemplate {
    return {
      jsonhex: this.input.getStrippedInput().trim()
    }
  }

  getAny() : any {
    return this['get' + this.input.getTypeName()]()
  }

  getInvalid() : void {
    return
  }
}

export default StringDecoder
