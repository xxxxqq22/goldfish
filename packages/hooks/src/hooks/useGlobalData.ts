import { default as App, app } from '../common/App';
import useState from './useState';

export default function useGlobalData<G extends Record<string, any>>(passInApp?: App) {
  // use `counter` to trigger the re-render.
  const [counter, setCounter] = useState(0);

  const realGlobal = passInApp || app;
  return {
    get<T extends keyof G>(key: T): G[T] | undefined {
      return realGlobal.data[key as string];
    },
    set<T extends keyof G>(key: T, value: G[T]) {
      if (realGlobal.data[key as string] !== value) {
        realGlobal.data[key as string] = value;
        setCounter(counter + 1);
      }
    },
  };
}
