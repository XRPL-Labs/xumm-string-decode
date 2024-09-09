'use strict'

import {StringTypeDetector, StringDecoder, StringType} from '../src'

interface InvalidType {
  string: string
  output: false
}

interface ValidType {
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
    'XummFeature' |
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
    StringType.XummFeature |
    StringType.XummXapp
}

describe('Non-XrplDestination', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('./Other').filter((g: InvalidType | ValidType) => {
    return g.output === false
  }).forEach((g: InvalidType) => {
    const inputs = g.string.includes('%{host}') ? StringTypeDetector.validHosts.map((h) => g.string.replace('%{host}', h)) : [g.string];
    inputs.forEach(str => {
      const detected = new StringTypeDetector(str)
      it('should detect error in [ ' + str + ' ]', () => {
        expect(detected.getType()).toEqual(StringType.Invalid)
      })
    })
  })

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('./Other').filter((g: InvalidType | ValidType) => {
    return g.output !== false
  }).forEach((g: ValidType) => {
    const inputs = g.string.includes('%{host}') ? StringTypeDetector.validHosts.map((h) => g.string.replace('%{host}', h)) : [g.string];
    inputs.forEach(str => {
      const detected = new StringTypeDetector(str)
      it('should detect and decode [ ' + StringType[detected.getType()] + ' ] from [ ' + str + ' ]', () => {
        expect(StringType[detected.getType()]).toEqual(g.type)
        const decoded = new StringDecoder(detected)
        expect(decoded['get' + StringType[detected.getType()]]()).toEqual(g.output)
      })
    })
  })
})
