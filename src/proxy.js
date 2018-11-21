import { proxy, proxyValue, expose } from 'comlinkjs'

export const exposeReducer = reducer => {
	if (!self) return reducer
	class ReducerWorker {
		createWorkerAction(action, newState) {
			return ({ type: action.type, payload: newState, meta: { fromWorker: true } })
		}

		dispatch(state, action) {
			const newState = reducer(state, action)
			return this.createWorkerAction(action, newState)
		}
	}
	expose(ReducerWorker, self)
	return reducer
}


export const reducerProxyMiddleware = proxy => store => next => action => {
  if (action.meta && action.meta.handleInWorker && proxy) {
    return proxy.then(worker => worker)
      .then(worker => worker.dispatch(store.getState(), action))
      .then(next)
  } else {
    return next(action)
  }
}

export const createProxy = reducerWorker => {
	const ReducerProxy = proxy(reducerWorker)
	const reducerProxy = new ReducerProxy()
	return reducerProxy
}

export const proxyMetaReducer = reducer => (state, action) => {
  if (action.meta && action.meta.fromWorker) {
    return state = { ...state, ...action.payload }
  }
  const nextState = reducer ? reducer(state, action) : state
  return nextState
}

