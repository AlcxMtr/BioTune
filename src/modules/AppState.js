// @flow
type AppStateType = {
  isFirstOpen: boolean,
  isLoggedIn: boolean,
};

type ActionType = {
  type: string,
  payload?: any,
};

export const initialState: AppStateType = {
  isFirstOpen: true,
  isLoggedIn: false,
};

export const SET_FIRST_OPEN = 'AppState/SET_FIRST_OPEN';
export const SET_LOGGED_IN = 'AppState/SET_LOGGED_IN';

export function setAppOpened(): ActionType {
  return {
    type: SET_FIRST_OPEN,
  };
}

export function setLoggedIn(): ActionType {
  return {
    type: SET_LOGGED_IN,
  };
}

export default function AppStateReducer(
  state: AppStateType = initialState,
  action: ActionType,
): AppStateType {
  switch (action.type) {
    case SET_FIRST_OPEN:
      return {
        ...state,
        isFirstOpen: false,
      };
    case SET_LOGGED_IN:
      return {
        ...state,
        isLoggedIn: true,
      };
    default:
      return state;
  }
}
