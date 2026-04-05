import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  useDispatch,
  useSelector,
  type TypedUseSelectorHook,
} from "react-redux";
import authReducer from "./slice/authSlice";
import globalReducer from "./slice/globalSlice";
import postsReducer from "./slice/postSlice";
import commentsReducer from "./slice/commentSlice";
import { baseApi } from "./api/baseApi";

const rootReducer = combineReducers({
  auth: authReducer,
  global: globalReducer,
  posts: postsReducer,
  comments: commentsReducer,
  [baseApi.reducerPath]: baseApi.reducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }).concat(
      baseApi.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
