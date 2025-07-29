import * as validation from '../src'
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

describe('validation-test', () => {
  describe('validating ssn', () => {
    test('accepts valid ssn', () => {
      assert.equal(validation.isSsnValid('231194-246W'), true)
    })

    test('accepts check char in lower case', () => {
      assert.equal(validation.isSsnValid('231194-246w'), true)
    })

    test('accepts ssn not from 20th century', () => {
      assert.equal(validation.isSsnValid('231194+246w'), true)
      assert.equal(validation.isSsnValid('010601A0102'), true)
      assert.equal(validation.isSsnValid('010601a0102'), true)
    })

    test('accepts ssn from 20th century', () => {
      assert.equal(validation.isSsnValid('010103A2465'), true)
      assert.equal(validation.isSsnValid('010280Y246u'), true)
      assert.equal(validation.isSsnValid('010280X246u'), true)
      assert.equal(validation.isSsnValid('010280W246u'), true)
      assert.equal(validation.isSsnValid('010280V246u'), true)
      assert.equal(validation.isSsnValid('010280U246u'), true)
      assert.equal(validation.isSsnValid('010280G246u'), false)
      assert.equal(validation.isSsnValid('010280y246u'), true)
      assert.equal(validation.isSsnValid('010280x246u'), true)
      assert.equal(validation.isSsnValid('010280w246u'), true)
      assert.equal(validation.isSsnValid('010280v246u'), true)
      assert.equal(validation.isSsnValid('010280u246u'), true)
      assert.equal(validation.isSsnValid('010280g246u'), false)
    })

    test('accepts ssn from 21st century', () => {
      assert.equal(validation.isSsnValid('010103A2465'), true)
      assert.equal(validation.isSsnValid('010103B2465'), true)
      assert.equal(validation.isSsnValid('010103C2465'), true)
      assert.equal(validation.isSsnValid('010103D2465'), true)
      assert.equal(validation.isSsnValid('010103E2465'), true)
      assert.equal(validation.isSsnValid('010103F2465'), true)
      assert.equal(validation.isSsnValid('010103a2465'), true)
      assert.equal(validation.isSsnValid('010103b2465'), true)
      assert.equal(validation.isSsnValid('010103c2465'), true)
      assert.equal(validation.isSsnValid('010103d2465'), true)
      assert.equal(validation.isSsnValid('010103e2465'), true)
      assert.equal(validation.isSsnValid('010103f2465'), true)
      assert.equal(validation.isSsnValid('010103Z2465'), false)
      assert.equal(validation.isSsnValid('010103z2465'), false)
    })

    test('accepts when check char is a number', () => {
      assert.equal(validation.isSsnValid('130672-4400'), true)
    })

    test('accepts ssn with leading and trailing whitespace ', () => {
      assert.equal(validation.isSsnValid(' 130672-4400\t\n'), true)
    })

    test('rejects when check char is wrong', () => {
      assert.equal(validation.isSsnValid('010601A010W'), false)
    })

    test('rejects when check char is missing', () => {
      assert.equal(validation.isSsnValid('010601A010'), false)
    })

    test('rejects when century separator is missing', () => {
      assert.equal(validation.isSsnValid('0106010102'), false)
    })

    test('rejects when century separator is invalid', () => {
      assert.equal(validation.isSsnValid('0907184X22N'), false)
      assert.equal(validation.isSsnValid('0907184x22N'), false)
    })

    test('rejects when there are extraneous alphabetical characters', () => {
      assert.equal(validation.isSsnValid('020698-01IS'), false)
    })

    test('rejects when ssn is too long', () => {
      assert.equal(validation.isSsnValid('130672-44001'), false)
    })

    test('rejects when ssn is too short', () => {
      assert.equal(validation.isSsnValid('130672-44'), false)
    })

    test('rejects when ssn length is valid but checksum char is whitespace', () => {
      assert.equal(validation.isSsnValid('130672-44 '), false)
    })

    test('accepts 010101-0101 as special case', () => {
      assert.equal(validation.isSsnValid('010101-0101'), true)
      assert.equal(validation.isSsnValid('010101-0101', true), true)
    })

    test('accepts when person is over hundred years old, and age sanity check is off', () => {
      assert.equal(validation.isSsnValid('100417-458U'), true)
      assert.equal(validation.isSsnValid('231194+246w'), true)
    })

    test('rejects when person is over hundred years old, and age sanity check is on', () => {
      assert.equal(validation.isSsnValid('100417-458U', true), false)
      assert.equal(validation.isSsnValid('231194+246w', true), false)
    })

    test('accepts person not yet born when age sanity check is off', () => {
      assert.equal(validation.isSsnValid('071144A239E'), true)
    })

    test('rejects person not yet born when age sanity check is on', () => {
      assert.equal(validation.isSsnValid('071144A239E', true), false)
    })

    test('Accepts an artificial ssn (last part starts with 9)', () => {
      assert.equal(validation.isSsnValid('010697-9184'), true)
    })

    test('Accepts a special YTL-defined fake ssn (checkCode calculation is skipped)', () => {
      assert.equal(validation.isSsnValid('210999-U097'), true)
    })
  })

  describe('isFakeYtlSsn', () => {
    test('detects "A" century seperator fake ssn', () => assert.equal(validation.isFakeYtlSsn('200102AU000'), true))

    test('detects "-" century seperator fake ssn', () => assert.equal(validation.isFakeYtlSsn('200192-U000'), true))

    test('rejects valid ssn', () => assert.equal(validation.isFakeYtlSsn('231194-246W'), false))
  })

  describe('isValidEmail', () => {
    test('Rejects invalid student email', () => {
      const invalidEmails = [
        'testuserexample.com',
        'testuserexample.com...',
        'tesdkjgqjeklqjwköejökqwjegökljeqwefiqewifqhweufhqowiuhfoqiuwehfoiuqwhefoiuqwhefoiuqhweofiuhqwoiuehfoqiuwehfouiqwehfoiuqwhefoiuqhweoiufhqwouiefhoqiuwehfoiquwehfoiuqhweiufhqwoieufhoqiuwehfoiuqhweouuiuweiqutqiopwuetiouqwepiotuqpwioeutpqwoeutpoqiwuetpoqiwuetpoquweodhlskjhfajdhlajsdhgituqwpoefiht@userexample.com',
        'erkki.emptysubdomain@.foo.bar',
        'test.user@@example.com',
        'test..user@example.com',
        'test.user@',
        '.test.user@example.com',
        ';test.user@example.com',
        'john.käärä@example.com',
        {} as string
      ]

      for (const email of invalidEmails) {
        assert.equal(validation.isValidEmail(email), false)
      }
    })

    test('accepts valid email', () => {
      const validEmails = ['', 'a@a.com', 'test@example.com']

      for (const email of validEmails) {
        assert.equal(validation.isValidEmail(email), true)
      }
    })
  })
})
