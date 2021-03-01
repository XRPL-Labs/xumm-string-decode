'use strict'

import {StringTypeDetector, StringDecoder, StringType} from '../src'

type InvalidType = {
  string: string
  output: false
}

type ValidType = {
  string: string
  type:
    'XummPayloadReference' |
    'XummPairingToken' |
    'XrplTransactionHash' |
    'XrplSecret' |
    'XrplSignedTransaction' |
    'XrplTransactionTemplate' |
    'XrplDestinationTag' |
    'XummTranslation' |
    'PayId' |
    'XrplAltFamilySeedAlphabet' |
    'XummXapp'
  output:
    StringType.XummPayloadReference |
    StringType.XummPairingToken |
    StringType.XrplTransactionHash |
    StringType.XrplSecret |
    StringType.XrplSignedTransaction |
    StringType.XrplTransactionTemplate |
    StringType.XrplDestinationTag |
    StringType.XummTranslation |
    StringType.PayId |
    StringType.XrplAltFamilySeedAlphabet |
    StringType.XummXapp
}

describe('Non-XrplDestination', () => {
  require('./Other').filter((g: InvalidType | ValidType) => {
    return g.output === false
  }).forEach((g: InvalidType) => {
    const detected = new StringTypeDetector(g.string)
    it('should detect error in [ ' + g.string + ' ]', () => {
      expect(detected.getType()).toEqual(StringType.Invalid)
    })
  })

  require('./Other').filter((g: InvalidType | ValidType) => {
    return g.output !== false
  }).forEach((g: ValidType) => {
    const detected = new StringTypeDetector(g.string)
    it('should detect and decode [ ' + StringType[detected.getType()] + ' ] from [ ' + g.string + ' ]', () => {
      expect(StringType[detected.getType()]).toEqual(g.type)
      const decoded = new StringDecoder(detected)
      expect(decoded['get' + StringType[detected.getType()]]()).toEqual(g.output)
    })
  })
})
