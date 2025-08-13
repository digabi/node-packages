import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

describe('examination-period', () => {
  describe('currentExaminationPeriod', () => {
    test('should expose period as constant', async context => {
      context.mock.timers.enable({ apis: ['Date'], now: new Date(2012, 0, 15) })

      const { currentExaminationPeriod } = await import('../src/index')
      assert.equal(currentExaminationPeriod, '2012K')
    })

    test('should return current period for spring', async context => {
      context.mock.timers.enable({ apis: ['Date'], now: new Date(2012, 0, 15) })

      const { getCurrentExaminationPeriod } = await import('../src/examination-period')
      const currentExaminationPeriod = getCurrentExaminationPeriod()
      assert.equal(currentExaminationPeriod, '2012K')
    })

    test('should return current period for fall', async context => {
      context.mock.timers.enable({ apis: ['Date'], now: new Date(2012, 7, 15) })

      const { getCurrentExaminationPeriod } = await import('../src/examination-period')
      const currentExaminationPeriod = getCurrentExaminationPeriod()
      assert.equal(currentExaminationPeriod, '2012S')
    })
  })
})
