'use strict'

import {StringType} from '../src/enums/StringType'
import {StringTypeDetector, StringDecoder} from '../src'

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
    'XrplTransactionTemplate'
  output:
    StringType.XummPayloadReference |
    StringType.XummPairingToken |
    StringType.XrplTransactionHash |
    StringType.XrplSecret |
    StringType.XrplSignedTransaction |
    StringType.XrplTransactionTemplate
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
