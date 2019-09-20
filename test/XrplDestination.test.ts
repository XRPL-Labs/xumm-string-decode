'use strict'

import {StringTypeDetector, StringDecoder, StringType} from '../src'

type XrplDestinationTest = {
  string: string
  output: StringType.XrplDestination | false
}

describe('XrplDestination', () => {
  require('./XrplDestination').filter((g: XrplDestinationTest) => {
    return g.output === false
  }).forEach((g: XrplDestinationTest) => {
    const detected = new StringTypeDetector(g.string)
    it('should detect error in [ ' + g.string + ' ]', () => {
      expect(detected.getType()).toEqual(StringType.Invalid)
    })
  })

  require('./XrplDestination').filter((g: XrplDestinationTest) => {
    return g.output !== false
  }).forEach((g: XrplDestinationTest) => {
    const detected = new StringTypeDetector(g.string)
    it('should decode [ ' + g.string + ' ]', () => {
      expect(detected.getType()).toEqual(StringType.XrplDestination)
      const decoded = new StringDecoder(detected)
      expect(decoded.getXrplDestination()).toEqual(g.output)
    })
  })
})
