import reducer from './reducer'
import { exposeReducer } from '../src/redux-webworker-proxy'

export default exposeReducer(reducer)
