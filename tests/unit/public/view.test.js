import { jest, expect, describe, test } from '@jest/globals'
import { JSDOM } from 'jsdom'
describe('#View - test suite for presentation layer', () => {
  const dom = new JSON()
  global.document = dom.window.document
  global.window = dom.window

  test.todo('#changeCommandButtonsVisibility - given hide = true it should add unassigned class and reset onclick')
  test.todo('#changeCommandButtonsVisibility - given hide = true it should remove unassigned class and reset onclick')
  test.todo('#onLoad')
});