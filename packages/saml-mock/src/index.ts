import fs from 'fs'
import path from 'path'
import util from 'util'
import zlib from 'zlib'

import express from 'express'
import handlebars from 'handlebars'
import { SignedXml } from 'xml-crypto'
import _ from 'lodash'
import { DOMParser, XMLSerializer } from '@xmldom/xmldom'
import { encrypt } from 'xml-encryption'

import type { SamlOptions } from '@node-saml/passport-saml'

const inflateRawAsync = util.promisify(zlib.inflateRaw)

const certificate = fs.readFileSync(path.join(__dirname, './certs/saml-certificate.pem'), 'utf-8').toString()
const privateKey = fs.readFileSync(path.join(__dirname, './certs/saml-privatekey.pem'), 'utf-8').toString()
const publicKey = fs.readFileSync(path.join(__dirname, './certs/saml-rsa-publickey.pem'), 'utf-8').toString()

const defaultSamlOptions = {
  audience: 'https://localhost'
}

export type SamlMockOverrides = {
  invalidateInResponseTo: boolean
  invalidateAssertionSignature: boolean
  skipAssertionEncryption: boolean
  invalidateTopLevelSignature: boolean
  skipTopLevelSignature: boolean
  skipAssertionSignature: boolean
}

function parseOverrides(query: Record<string, unknown>): SamlMockOverrides {
  return {
    invalidateInResponseTo: query.invalidateInResponseTo === 'true',
    invalidateAssertionSignature: query.invalidateAssertionSignature === 'true',
    skipAssertionEncryption: query.skipAssertionEncryption === 'true',
    invalidateTopLevelSignature: query.invalidateTopLevelSignature === 'true',
    skipTopLevelSignature: query.skipTopLevelSignature === 'true',
    skipAssertionSignature: query.skipAssertionSignature === 'true'
  }
}

export function createSamlMockRouter(
  samlCallbackUrl: string,
  getCurrentMockUserFunc: () => Promise<unknown>,
  samlOptions: Partial<SamlOptions>
) {
  const router = express.Router()

  router.get('/', async (req, res, next) => {
    const buffer = await inflateRawAsync(Buffer.from(req.query.SAMLRequest as string, 'base64'))
    const session = buffer
      .toString()
      .match(/(ID=".*?")/)![1]
      .substring(4)
      .slice(0, -1)
    const now = new Date()
    const tenMinutesLater = new Date(now.getTime() + 10 * 60 * 1000)
    const sigAlg = req.query?.SigAlg as string

    const {
      invalidateAssertionSignature,
      invalidateTopLevelSignature,
      skipAssertionSignature,
      skipTopLevelSignature,
      skipAssertionEncryption,
      invalidateInResponseTo
    } = parseOverrides(req.query)

    const responseObject = {
      now: now.toISOString(),
      validTo: tenMinutesLater.toISOString(),
      requestId: generateID(),
      assertionId: generateID(),
      // Allow override of inResponseTo with samlOptions for testing purposes
      inResponseTo: invalidateInResponseTo ? 'invalidResponse' : session
    }

    const mockUser = await getCurrentMockUserFunc()
    const options = { audience: samlOptions.audience ?? defaultSamlOptions.audience }
    const merge = _.merge({}, responseObject, mockUser, options)

    const responseTemplate = compileTemplateFile('saml-response.hbs')
    const xmlWithProps = responseTemplate(merge)

    // Allow skipping of assertion signature
    let signedAssertion = signXml(xmlWithProps, 'Assertion', sigAlg, invalidateAssertionSignature)
    if (skipAssertionSignature) {
      signedAssertion = xmlWithProps
    }

    // Allow skipping of assertion encryption for testing purposes
    let encryptedAssertion = await encryptXml(signedAssertion, 'saml:Assertion', 'saml:EncryptedAssertion')
    if (skipAssertionEncryption) {
      encryptedAssertion = signedAssertion
    }

    // Allow skipping top level signature for testing purposes
    let signedResponse = signXml(encryptedAssertion, 'Response', sigAlg, invalidateTopLevelSignature)
    if (skipTopLevelSignature) {
      signedResponse = encryptedAssertion
    }

    const samlResponse = Buffer.from(signedResponse).toString('base64')

    const redirectPageTemplate = compileTemplateFile('saml-redirecting.hbs')

    return res.send(redirectPageTemplate({ samlResponse, samlCallbackUrl }))
  })

  router.get('/saml.js', (_, res) => res.sendFile(path.join(`${__dirname}/templates`, 'saml.js')))

  router.get('/logout', (req, res) => {
    res.redirect('/')
  })

  return router
}

function generateID() {
  const possible = 'abcdef0123456789'
  const randomId = _.range(14)
    .map(() => possible.charAt(Math.floor(Math.random() * possible.length)))
    .join('')
  return `_${randomId}`
}

function signXml(xml: string, localName: string, sigAlg: string, createInvalidSignature: boolean) {
  const signed = new SignedXml()

  signed.privateKey = privateKey
  signed.publicCert = certificate
  signed.signatureAlgorithm = sigAlg ?? 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256'
  signed.canonicalizationAlgorithm = 'http://www.w3.org/2001/10/xml-exc-c14n#'
  const referenceTransforms = [
    'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
    'http://www.w3.org/2001/10/xml-exc-c14n#'
  ]

  // Allow creation of invalid signature for testing purposes
  if (createInvalidSignature) {
    // Remove canonicalization algorithm from transforms. This causes the signature to be invalid
    //   because xml-crypto will format the xml document before signing
    referenceTransforms.pop()
  }

  signed.addReference({
    xpath: `//*[local-name(.)='${localName}']`,
    digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
    transforms: referenceTransforms
  })

  signed.computeSignature(xml, {
    prefix: 'ds',
    location: {
      action: 'prepend',
      reference: `//*[local-name(.)='${localName}']`
    }
  })

  return signed.getSignedXml()
}

function encryptXml(xml: string, localName: string, encryptedLocalName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xml, 'text/xml')
    const nodeToEncrypt = xmlDoc.getElementsByTagName(localName)[0]
    const nodeString = new XMLSerializer().serializeToString(nodeToEncrypt)

    encrypt(
      nodeString,
      {
        rsa_pub: publicKey,
        pem: certificate,
        encryptionAlgorithm: 'http://www.w3.org/2001/04/xmlenc#aes256-cbc',
        keyEncryptionAlgorithm: 'http://www.w3.org/2001/04/xmlenc#rsa-oaep-mgf1p'
      },
      (err, encryptedData) => {
        if (err) {
          reject(err)
        }

        const encryptedNode = xmlDoc.createElement(encryptedLocalName)
        const encryptedDoc = parser.parseFromString(encryptedData, 'text/xml')
        const encryptedDocRoot = encryptedDoc.documentElement
        const importedNode = xmlDoc.importNode(encryptedDocRoot!, true)
        encryptedNode.appendChild(importedNode)
        nodeToEncrypt.parentNode!.replaceChild(encryptedNode, nodeToEncrypt)

        const serializer = new XMLSerializer()
        const modifiedXmlString = serializer.serializeToString(xmlDoc)
        resolve(modifiedXmlString)
      }
    )
  })
}

function compileTemplateFile(templateFile: string) {
  return handlebars.compile(fs.readFileSync(path.join(`${__dirname}/templates`, templateFile)).toString())
}

export function getSamlMockCertificates() {
  return { privateKey, publicKey, certificate }
}
