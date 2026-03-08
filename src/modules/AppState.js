// @flow
type AppStateType = {
  isFirstOpen: boolean,
  isLoggedIn: boolean,
  accountType: string | null,
};

type ActionType = {
  type: string,
  payload?: any,
};

export const initialState: AppStateType = {
  isFirstOpen: true,
  isLoggedIn: false,
  accountType: null,
};

export const SET_FIRST_OPEN = 'AppState/SET_FIRST_OPEN';
export const SET_LOGGED_IN = 'AppState/SET_LOGGED_IN';
export const SET_LOGGED_OUT = 'AppState/SET_LOGGED_OUT';
export const SET_ACCOUNT_TYPE = 'AppState/SET_ACCOUNT_TYPE';

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

export function setLoggedOut(): ActionType {
  return {
    type: SET_LOGGED_OUT,
  };
}

export function setAccountType(accountType: string): ActionType {
  return {
    type: SET_ACCOUNT_TYPE,
    payload: accountType,
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
    case SET_LOGGED_OUT:
      return {
        ...state,
        isLoggedIn: false,
        accountType: null,
      };
    case SET_ACCOUNT_TYPE:
      return {
        ...state,
        accountType: action.payload,
      };
    default:
      return state;
  }
}
