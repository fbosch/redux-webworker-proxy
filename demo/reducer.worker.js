import { exposeReducer } from '../src/redux-webworker-proxy'
import reducer from './reducer'

export default exposeReducer(reducer)
