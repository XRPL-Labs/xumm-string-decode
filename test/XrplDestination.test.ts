'use strict'

import {StringType} from '../src/enums/StringType'
import StringTypeDetector from '../src/classes/StringTypeDetector'
import XRPLStringDecoder from '../src'

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
      const decoded = new XRPLStringDecoder(detected)
      expect(decoded.getXrplDestination()).toEqual(g.output)
    })
  })
})
