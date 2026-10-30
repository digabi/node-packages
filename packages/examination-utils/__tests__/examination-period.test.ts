import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

describe('examination-period', () => {
  describe('currentExaminationPeriod', () => {
    test('should expose period as constant', async context => {
      context.mock.timers.enable({ apis: ['Date'], now: new Date(2012, 0, 15) })

      const { currentExaminationPeriod } = await import('../src/index.js')
      assert.equal(currentExaminationPeriod, '2012K')
    })

    test('should return current period for spring', async context => {
      context.mock.timers.enable({ apis: ['Date'], now: new Date(2012, 0, 15) })

      const { getCurrentExaminationPeriod } = await import('../src/examination-period.js')
      const currentExaminationPeriod = getCurrentExaminationPeriod()
      assert.equal(currentExaminationPeriod, '2012K')
    })

    test('should return current period for fall', async context => {
      context.mock.timers.enable({ apis: ['Date'], now: new Date(2012, 7, 15) })

      const { getCurrentExaminationPeriod } = await import('../src/examination-period.js')
      const currentExaminationPeriod = getCurrentExaminationPeriod()
      assert.equal(currentExaminationPeriod, '2012S')
    })

    describe('examination period override', () => {
      beforeEach(() => {
        delete process.env.EXAMINATION_PERIOD_OVERRIDE
      })

      test('should use the clock when EXAMINATION_PERIOD_OVERRIDE is undefined', async context => {
        context.mock.timers.enable({ apis: ['Date'], now: new Date(2012, 0, 15) })

        const { getCurrentExaminationPeriod } = await import('../src/examination-period.js')
        assert.equal(getCurrentExaminationPeriod(), '2012K')
      })

      test('should use EXAMINATION_PERIOD_OVERRIDE when it is set', async context => {
        context.mock.timers.enable({ apis: ['Date'], now: new Date(2012, 0, 15) })
        process.env.EXAMINATION_PERIOD_OVERRIDE = '2027K'

        const { getCurrentExaminationPeriod } = await import('../src/examination-period.js')
        assert.equal(getCurrentExaminationPeriod(), '2027K')
      })

      test('should use the clock when EXAMINATION_PERIOD_OVERRIDE is empty', async context => {
        context.mock.timers.enable({ apis: ['Date'], now: new Date(2012, 0, 15) })
        process.env.EXAMINATION_PERIOD_OVERRIDE = ''

        const { getCurrentExaminationPeriod } = await import('../src/examination-period.js')
        assert.equal(getCurrentExaminationPeriod(), '2012K')
      })

      test('should use the clock when process does not exist, as in frontend bundles', async context => {
        context.mock.timers.enable({ apis: ['Date'], now: new Date(2012, 0, 15) })
        const { getCurrentExaminationPeriod } = await import('../src/examination-period.js')

        const processDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'process')!
        Object.defineProperty(globalThis, 'process', { value: undefined, configurable: true })
        let examinationPeriod: string
        try {
          examinationPeriod = getCurrentExaminationPeriod()
        } finally {
          Object.defineProperty(globalThis, 'process', processDescriptor)
        }
        assert.equal(examinationPeriod, '2012K')
      })
    })
  })
})
