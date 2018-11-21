import { proxy, proxyValue, expose } from 'comlinkjs'

export const exposeReducer = reducer => {
	if (!self) return reducer
	class ReducerWorker {
		dispatch(state, action) {
			const newState = reducer(state, action)
			return ({ type: action.type, payload: newState, _workerProxy: true })
		}
	}
	expose(ReducerWorker, self)
	return reducer
}

export const reducerProxyMiddleware = proxy => store => next => action => {
  if (action.meta && action.meta.useWorker && proxy) {
    return proxy.then(worker => worker)
      .then(worker => worker.dispatch(store.getState(), action))
      .then(next)
  } else {
    return next(action)
  }
}

export const createProxy = worker => {
	const Proxy = proxy(worker)
	return new Proxy()
}

export const proxyMetaReducer = reducer => (state, action) => {
  if (action._workerProxy) {
    return state = { ...state, ...action.payload }
  }
  const nextState = reducer ? reducer(state, action) : state
  return nextState
}

