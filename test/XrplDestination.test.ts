'use strict'

import {StringTypeDetector, StringDecoder, StringType} from '../src'

interface XrplDestinationTest {
  string: string
  output: StringType.XrplDestination | false
}

describe('XrplDestination', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('./XrplDestination').filter((g: XrplDestinationTest) => {
    return g.output === false
  }).forEach((g: XrplDestinationTest) => {
    const inputs = g.string.includes('%{host}') ? StringTypeDetector.validHosts.map((h) => g.string.replace('%{host}', h)) : [g.string];
    inputs.forEach(str => {
      const detected = new StringTypeDetector(str)
      it('should detect error in [ ' + str + ' ]', () => {
        expect(detected.getType()).toEqual(StringType.Invalid)
      })
    })
  })

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('./XrplDestination').filter((g: XrplDestinationTest) => {
    return g.output !== false
  }).forEach((g: XrplDestinationTest) => {
    const inputs = g.string.includes('%{host}') ? StringTypeDetector.validHosts.map((h) => g.string.replace('%{host}', h)) : [g.string];

    inputs.forEach(str => {
      const detected = new StringTypeDetector(str)
      it('should decode [ ' + JSON.stringify(str) + ' ]', () => {
        expect(detected.getType()).toEqual(StringType.XrplDestination)
        const decoded = new StringDecoder(detected)
        expect(decoded.getXrplDestination()).toEqual(g.output)
      })
    })
  })
})
