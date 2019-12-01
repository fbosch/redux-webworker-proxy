/* eslint-env node, worker */

import * as Comlink from 'comlink'

const IS_WORKER = typeof importScripts === 'function'
const SUPPORTS_PROXIES = typeof Proxy === 'function'
// const cores = !IS_WORKER && window.navigator.hardwareConcurrency
const defaultOptions = {
  terminateOnIdle: true,
  idleTimeout: 1000 * 60 * 1
}
const proxyInstances = new WeakMap()
const workers = new Map()
const workerSpawners = new Map()
const runningWorkers = new Map()
const actionResults = new WeakMap()
const terminators = new Map()
const workerOptions = new Map()
const identifiers = new Set()

const getOptionsForIdentifier = identifier => workerOptions.get(identifier)
const getStateSliceForIdentifier = identifier => getOptionsForIdentifier(identifier).stateSlice || null

const getReducerProxyForWorker = worker => {
  if (proxyInstances.has(worker)) {
    return proxyInstances.get(worker)
  } else {
    try {
      const proxyReducer = Comlink.proxy(worker)
      proxyInstances.set(worker, proxyReducer)
      return proxyReducer
    } catch (e) { console.warn(e) }
  }
}

const terminateWorkerAndProxy = identifier => {
  const workerProxy = runningWorkers.get(identifier)
  const webWorker = workers.get(identifier)
  workerProxy[Comlink.releaseProxy]()
  webWorker.terminate()
  runningWorkers.delete(identifier)
  workers.delete(identifier)
  terminators.delete(identifier)
}

const terminateWorkerOnIdle = identifier => window.setTimeout(() => terminateWorkerAndProxy(identifier), getOptionsForIdentifier(identifier).idleTimeout)

const getProxyByIdentifier = identifier => {
  if (identifiers.has(identifier)) {
    const options = getOptionsForIdentifier(identifier)
    if (runningWorkers.has(identifier)) {
      if (options.terminateOnIdle) {
        window.clearTimeout(terminators.get(identifier))
        window.requestIdleCallback(() => terminators.set(identifier, terminateWorkerOnIdle(identifier)))
      }
      return getReducerProxyForWorker(runningWorkers.get(identifier))
    } else {
      const spawnWorker = workerSpawners.get(identifier)
      const worker = spawnWorker()
      if (worker) {
        runningWorkers.set(identifier, worker)
        if (options.terminateOnIdle) window.requestIdleCallback(() => terminators.set(identifier, terminateWorkerOnIdle(identifier)))
        return getReducerProxyForWorker(worker)
      }
    }
  }
}

export const terminateAllWorkers = () => identifiers.forEach(terminateWorkerAndProxy)

export const connectReducerWorker = reducer => (Worker, { identifier = true, ...options } = { }) => {
  if (SUPPORTS_PROXIES && Worker) {
    const isConstructor = Boolean(Worker.prototype) && Boolean(Worker.prototype.constructor.name)
    const worker = isConstructor ? () => new Worker() : (typeof Worker === 'function' ? () => Worker() : () => Worker)
    const spawnWorker = () => {
      try {
        const webWorker = worker()
        workers.set(identifier, webWorker)
        return Comlink.wrap(webWorker)
      } catch (e) {
        console.log(e)
        return null
      }
    }
    identifiers.add(identifier)
    workerSpawners.set(identifier, spawnWorker)
    workerOptions.set(identifier, { ...defaultOptions, ...options })
  }
  return reducer
}

export const exposeReducer = reducer => {
  if (IS_WORKER) {
    const exposedReducer = (state, action) => {
      const result = reducer(state, action)
      if (state === result) return null
      return result
    }
    Comlink.expose(exposedReducer, self)
  }
  return reducer
}

export const workerMiddleware = store => next => action => {
  if (SUPPORTS_PROXIES && action.meta && action.meta.useWorker) {
    const reducerProxy = getProxyByIdentifier(action.meta.useWorker)
    if (reducerProxy) {
      const slice = getStateSliceForIdentifier(action.meta.useWorker)
      const state = slice ? store.getState()[slice] : store.getState()
      return reducerProxy(state, action)
        .then(newState => {
          if (newState) {
            actionResults.set(action, newState)
            next(action)
          }
        }).catch(e => {
          console.warn(e)
          next(action)
        })
    }
  }
  if (actionResults.has(action) === false) {
    return next(action)
  }
}

export const connectWorkers = reducer => (state, action) => {
  if (action.meta && action.meta.useWorker && actionResults.has(action) && SUPPORTS_PROXIES) {
    const newState = actionResults.get(action)
    const slice = getStateSliceForIdentifier(action.meta.useWorker)
    actionResults.delete(action)
    return slice ? { ...state, [slice]: { ...state[slice], ...newState } } : { ...state, ...newState }
  }
  return reducer(state, action)
}
