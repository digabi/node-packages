import { Server } from 'http'
import { AddressInfo } from 'net'
import express from 'express'

function testAppContext() {
  let serverPrefix: string
  let listeningApp: Server

  function initApp(app: ReturnType<typeof express>) {
    return function () {
      return new Promise(resolve => {
        listeningApp = app.listen(0, () => {
          const { port } = listeningApp.address() as AddressInfo
          serverPrefix = `http://localhost:${port}`

          resolve(true)
        })
      })
    }
  }

  function getServerPrefix() {
    return serverPrefix
  }

  function closeApp() {
    listeningApp.close()
  }

  return {
    initApp: initApp,
    closeApp: closeApp,
    getServerPrefix: getServerPrefix
  }
}

const defaultContext = testAppContext()

export default {
  initApp: defaultContext.initApp,
  closeApp: defaultContext.closeApp,
  getServerPrefix: defaultContext.getServerPrefix,
  testAppContext: testAppContext
}
