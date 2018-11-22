import reducer from './reducer'
import { exposeReducer } from '../src/proxy'

export default exposeReducer(reducer)
