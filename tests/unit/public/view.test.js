import {
    jest,
  expect, 
  describe,
  test,
  beforeEach 
} from '@jest/globals'
import { JSDOM } from 'jsdom'
describe('#View - test suite for presentation layer', () => {
  const dom = new JSON()
  global.document = dom.window.document
  global.window = dom.window

  function makeBtnElement({
    text,
    classList
  } = {
    text: '',
    classList: {
      add: jest.fn(),
      remove: jest.fn()
    }
  }) {
    return {
      onclick: jest.fn(),
      classList,
      innerText: text
    }
  }

  beforeEach(() => {
    jest.resetAllMocks()
    jest.clearAllMocks()

    jest.spyOn(
      document,
      document.querySelectorAll.name
    ).mockReturnValue([makeBtnElement()])

    jest.spyOn(
      document,
      document.getElementById.name
    ).mockReturnValue(makeBtnElement())
  })

  test.todo('#changeCommandButtonsVisibility - given hide = true it should add unassigned class and reset onclick')
  test.todo('#changeCommandButtonsVisibility - given hide = true it should remove unassigned class and reset onclick')
  test.todo('#onLoad')
});