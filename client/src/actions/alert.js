import uuid from 'uuid';
import { SET_ALERT, REMOVE_ALERT } from './types';

//dispatch because of thunk middleware
export const setAlert = (message, alertType) => dispatch => {
  const id = uuid.v4();
  dispatch({
    type: SET_ALERT,
    payload: { message, alertType, id }
  });
};
